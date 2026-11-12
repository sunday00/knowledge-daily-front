import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useUserPoint, useUserPointInc } from '@/lib/userPoint.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { usePointHistory, type PointHistoryFilter } from '@/hooks/usePointHistory.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const FILTER_PARAM = 'type'
const TABS: { key: PointHistoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'earn', label: '획득' },
  { key: 'spend', label: '지출' },
]

const EMPTY: Record<PointHistoryFilter, string> = {
  all: '아직 포인트 내역이 없습니다.',
  earn: '아직 받은 포인트가 없습니다.',
  spend: '아직 쓴 포인트가 없습니다.',
}

/** /user/point — 내 포인트 내역. 최신순, 아래로 내리면 이어 받는다. 전체 / 획득 / 지출 탭 */
export default function PointHistoryPage() {
  const { user } = useAuth()
  const point = useUserPoint()
  const inc = useUserPointInc()
  const [params] = useSearchParams()
  const raw = params.get(FILTER_PARAM)
  const filter: PointHistoryFilter = raw === 'earn' || raw === 'spend' ? raw : 'all'

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">포인트 내역</h2>
        {point !== null && (
          <p className="text-sm text-neutral-500">
            보유{' '}
            <span className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">
              {point.toLocaleString()}P
            </span>
            {inc !== null && (
              <span className="ml-2 text-xs">
                누적 획득 <span className="tabular-nums">{inc.toLocaleString()}P</span>
              </span>
            )}
          </p>
        )}
      </div>
      <FilterTabs current={filter} />
      {/* 탭마다 목록을 새로 그려 스크롤 감지·커서가 섞이지 않게 한다 */}
      <HistoryList key={filter} filter={filter} />
    </section>
  )
}

function FilterTabs({ current }: { current: PointHistoryFilter }) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="포인트 내역 분류"
      className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800"
    >
      {TABS.map((t) => {
        const active = t.key === current
        return (
          <Link
            key={t.key}
            to={t.key === 'all' ? pathname : `${pathname}?${FILTER_PARAM}=${t.key}`}
            replace
            aria-current={active ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm no-underline transition-colors ${
              active
                ? 'border-brand-600 font-medium text-brand-600 dark:border-indigo-300 dark:text-indigo-300'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

function HistoryList({ filter }: { filter: PointHistoryFilter }) {
  const { res, loading, loadingMore, error, loadMore } = usePointHistory(filter)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)
  const items = res?.items ?? []

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (res && !res.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }
  if (items.length === 0) return <p className="text-neutral-500">{EMPTY[filter]}</p>

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {items.map((h) => {
          const earn = h.delta > 0
          return (
            <li key={h._id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {/* 사유 표시명이 없으면 적립/사용으로 */}
                  {h.reasonDetail?.counterLabel || (earn ? '포인트 적립' : '포인트 사용')}
                </p>
                <time dateTime={String(h.createdAt)} className="block text-xs text-neutral-500">
                  {formatDateTime(h.createdAt)}
                </time>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p
                  className={`font-semibold ${
                    earn ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {earn ? '+' : ''}
                  {h.delta.toLocaleString()}P
                </p>
                <p className="text-xs text-neutral-500">잔액 {h.balance.toLocaleString()}P</p>
              </div>
            </li>
          )
        })}
      </ul>
      {loadingMore && <LoadingSpinner size="sm" />}
      <div ref={sentinelRef} aria-hidden />
    </div>
  )
}
