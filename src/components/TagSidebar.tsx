import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { TAG_STANDARD_LIST_QUERY } from '@/graphql/queries/tag.ts'
import { FlameIcon } from '@/components/FlameIcon.tsx'

const PAGE_SIZE = 50

// 이름순 정렬에서는 커서(_id 기준)로 넘기면 항목이 빠지므로 page 번호로 넘긴다.
const variables = { input: { size: PAGE_SIZE, page: 1, sort: { name: 1 } } }

// 태그 사이드 공용 레이아웃: 모바일에서는 위쪽 칩 목록, md 이상에서는 좌측 세로 목록.
export const TAG_ASIDE_CLASS = 'md:w-40 shrink-0 space-y-2 md:sticky md:top-4 md:self-start'
export const TAG_LIST_CLASS =
  'flex flex-wrap gap-1.5 max-h-40 overflow-y-auto md:block md:space-y-0.5 md:max-h-[70vh]'

/** 태그 사이드 목록의 한 줄. 선택(active)은 진하게, 인기(popular)는 주황 + 불꽃. */
export function TagNavLink({
  to,
  label,
  active,
  popular = false,
}: {
  to: string
  label: string
  active: boolean
  popular?: boolean
}) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm no-underline transition-colors ${
        active
          ? 'bg-brand-600 text-white'
          : popular
            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-medium hover:bg-orange-100 dark:hover:bg-orange-500/20'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="truncate">{label}</span>
      {popular && (
        <FlameIcon
          size={14}
          className={`shrink-0 ${active ? 'text-white' : 'text-orange-500 dark:text-orange-400'}`}
        />
      )}
    </Link>
  )
}

type Props = {
  /** 현재 선택된 태그 이름 */
  active?: string
  /** 인기 태그 (순위순). 목록 최상단에 강조해서 둔다. */
  popular: { _id: string; name: string }[]
}

/** 태그 전체 목록 (인기 태그 먼저, 나머지는 이름순) */
export function TagSidebar({ active, popular }: Props) {
  const { data, loading, error, fetchMore, networkStatus } = useQuery(TAG_STANDARD_LIST_QUERY, {
    variables,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  })
  const res = data?.TagQuery.tagStandardList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  // 인기 태그는 아직 안 받은 페이지에 있어도 맨 위에 보이도록 따로 앞에 붙이고, 이름순 목록에서는 뺀다.
  const popularIds = useMemo(() => new Set(popular.map((t) => t._id)), [popular])
  const tags = useMemo(
    () => [...popular, ...(res?.items ?? []).filter((t) => !popularIds.has(t._id))],
    [popular, popularIds, res],
  )

  const loadMore = () => {
    if (!res?.hasNext || loadingMore) return
    // 캐시에 쌓인 항목 수로 다음 페이지를 정한다. (화면을 다시 열어도 이어서 받을 수 있게)
    const nextPage = Math.ceil(res.items.length / PAGE_SIZE) + 1
    void fetchMore({
      variables: { input: { ...variables.input, page: nextPage } },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.TagQuery.tagStandardList
        return {
          ...prev,
          TagQuery: {
            ...prev.TagQuery,
            tagStandardList: {
              ...next,
              items: [...prev.TagQuery.tagStandardList.items, ...next.items],
            },
          },
        }
      },
    })
  }

  return (
    <aside className={TAG_ASIDE_CLASS}>
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">태그 목록</h2>

      {loading && !res && <p className="text-sm text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">조회 실패</p>}
      {res && !res.success && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        tags.length === 0 ? (
          <p className="text-sm text-neutral-500">등록된 태그가 없습니다.</p>
        ) : (
          <ul className={TAG_LIST_CLASS}>
            {tags.map((t) => (
              <li key={t._id}>
                <TagNavLink
                  to={`/tags/${encodeURIComponent(t.name)}`}
                  label={`#${t.name}`}
                  active={t.name === active}
                  popular={popularIds.has(t._id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {res?.success && res.hasNext ? (
        <button type="button" className="btn text-sm" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? '불러오는 중...' : '더 보기'}
        </button>
      ) : null}
    </aside>
  )
}
