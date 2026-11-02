import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { NOTICE_TICKER_QUERY } from '@/graphql/queries/notice.ts'
import { isLive, useLiveWindowSearch } from '@/lib/liveWindow.ts'
import { NOTICE_PATH, NOTICE_TITLE, noticeItemPath } from '@/lib/notice.ts'
import { readTickerCache, writeTickerCache } from '@/lib/noticeTickerCache.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const INTERVAL_MS = 3500
/** 롤링 애니메이션 시간 (motion-safe:duration-500 과 맞춘다) */
const SLIDE_MS = 500
const SIZE = 10
/** 한 줄 높이 (rem). 롤링은 이 높이만큼 위로 올린다. */
const ROW_REM = 2.5

/** 게시 기간을 다시 확인하는 주기. 보고 있는 동안 끝난 공지는 빠지고, 시작된 공지는 다음 조회 때 들어온다. */
const LIVE_CHECK_MS = 30 * 1000

/**
 * 노출 위치(spot)의 게시 중인 공지 제목을 한 줄씩 세로로 굴린다.
 * 마우스를 올리거나 포커스가 있으면 멈춘다. 긴 제목은 … 으로 줄인다.
 * 목록은 5분간 로컬에 보관해 그동안은 다시 요청하지 않고, 게시 기간은 꺼내 쓸 때마다 확인한다.
 */
export function NoticeTicker({ spot }: { spot: string }) {
  // 5분 안에 받은 목록이 있으면 요청하지 않는다. (처음 그릴 때 한 번만 읽는다)
  const [cached] = useState(() => readTickerCache(spot))
  const liveWindow = useLiveWindowSearch()
  const { data, loading } = useQuery(NOTICE_TICKER_QUERY, {
    variables: {
      input: {
        size: SIZE,
        page: 1,
        search: { exposedOn: { eq: spot }, status: { eq: 'ACTIVE' }, ...liveWindow },
        sort: { sortKey: 1, _id: -1 },
      },
    },
    skip: !!cached,
    // 보관 기간은 로컬 캐시(5분)로만 정한다. Apollo 메모리 캐시의 오래된 결과는 쓰지 않는다.
    fetchPolicy: 'network-only',
  })
  const res = data?.NoticeQuery.noticeStandardList
  const fetched = res?.success ? res.items : null

  useEffect(() => {
    if (fetched) writeTickerCache(spot, fetched)
  }, [spot, fetched])

  // 게시 기간 확인용 현재 시각. 받은 목록도, 보관했던 목록도 지금 기준으로 거른다.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), LIVE_CHECK_MS)
    return () => window.clearInterval(timer)
  }, [])
  const source = cached ?? fetched
  const notices = useMemo(() => (source ?? []).filter((n) => isLive(n, now)), [source, now])

  if (!source && loading) return <LoadingSpinner size="sm" label="공지 불러오는 중..." />
  if (notices.length === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4">
      <Link
        to={NOTICE_PATH}
        className="shrink-0 text-sm font-semibold text-brand-600 dark:text-indigo-300 no-underline"
      >
        📢 {NOTICE_TITLE}
      </Link>
      <Rolling notices={notices} />
    </div>
  )
}

function Rolling({ notices }: { notices: { _id: string; title: string }[] }) {
  const count = notices.length
  // 마지막 다음에 첫 줄을 한 번 더 붙여, 끝에서 처음으로 넘어갈 때도 위로 이어 올라가게 한다.
  const rows = count > 1 ? [...notices, notices[0]] : notices
  const [index, setIndex] = useState(0)
  // 복제한 첫 줄에 닿으면 애니메이션 없이 진짜 첫 줄로 되돌린다.
  const [jumping, setJumping] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (count < 2 || paused) return
    const timer = window.setTimeout(() => {
      setJumping(false)
      setIndex((i) => i + 1)
    }, INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [count, index, paused])

  // 복제한 첫 줄까지 올라가면 애니메이션이 끝난 뒤 진짜 첫 줄로 되돌린다.
  // (transitionend 는 움직임 줄이기 설정이나 백그라운드 탭에서 오지 않을 수 있어 시간으로 맞춘다)
  // 목록이 줄어 범위를 벗어난 경우도 처음으로.
  useEffect(() => {
    if (index < count) return
    const timer = window.setTimeout(() => {
      setJumping(true)
      setIndex(0)
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [count, index])

  const current = index % count

  return (
    <div
      className="relative min-w-0 flex-1 overflow-hidden"
      style={{ height: `${ROW_REM}rem` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul
        aria-live="off"
        className={jumping ? '' : 'motion-safe:transition-transform motion-safe:duration-500'}
        style={{ transform: `translateY(-${index * ROW_REM}rem)` }}
      >
        {rows.map((n, i) => {
          // 화면에 보이는 줄만 탭 이동·스크린리더 대상으로
          const visible = i === index
          return (
            <li
              key={`${n._id}-${i}`}
              aria-hidden={!visible}
              className="flex items-center"
              style={{ height: `${ROW_REM}rem` }}
            >
              <Link
                to={noticeItemPath(n._id)}
                tabIndex={visible ? undefined : -1}
                title={n.title}
                className="block min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200 no-underline hover:text-brand-600 dark:hover:text-indigo-300"
              >
                {n.title}
              </Link>
            </li>
          )
        })}
      </ul>
      {count > 1 && (
        <span className="sr-only">
          {count}개 중 {current + 1}번째 공지
        </span>
      )}
    </div>
  )
}
