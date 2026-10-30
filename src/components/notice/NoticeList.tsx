import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { NOTICE_LIST_QUERY } from '@/graphql/queries/notice.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { isLive, useLiveWindowSearch } from '@/lib/liveWindow.ts'
import { isPinnedNotice, noticeCategoryLabel, noticeItemPath } from '@/lib/notice.ts'
import { BoardItemCounts } from '@/components/board/BoardItemCounts.tsx'
import { Pagination, usePageParam } from '@/components/Pagination.tsx'
import { ImageIcon } from '@/components/ImageIcon.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const PAGE_SIZE = 20

/** 공지 목록. 게시 중(ACTIVE, startAt~endAt)인 것만, 고정(sortKey 작은 순) 먼저 그다음 최신순. */
export function NoticeList() {
  const page = usePageParam()
  const location = useLocation()
  const liveWindow = useLiveWindowSearch()
  const { data, previousData, loading, error } = useQuery(NOTICE_LIST_QUERY, {
    variables: {
      input: {
        size: PAGE_SIZE,
        page,
        search: { status: { eq: 'ACTIVE' }, ...liveWindow },
        sort: { sortKey: 1, _id: -1 },
      },
    },
    fetchPolicy: 'cache-and-network',
  })
  // 페이지를 옮기는 동안엔 이전 페이지를 그대로 두어 화면이 비지 않게 한다.
  const res = (data ?? previousData)?.NoticeQuery.noticeStandardList
  const maxPage = res?.maxPage || Math.ceil((res?.total ?? 0) / PAGE_SIZE)
  // 기준 시각을 내려 맞춰 받으므로, 정확한 게시 기간으로 다시 거른다.
  const now = Date.now()
  const items = (res?.items ?? []).filter((n) => isLive(n, now))

  return (
    <div className={`space-y-3 ${loading && res ? 'opacity-60' : ''}`}>
      <div className="flex min-h-9 items-center text-sm text-neutral-500">
        {res?.success ? `총 ${(res.total ?? 0).toLocaleString()}개` : null}
      </div>
      {loading && !res && <LoadingSpinner />}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        items.length === 0 ? (
          <p className="text-neutral-500">
            {page > 1 ? '이 페이지에는 공지가 없습니다.' : '아직 등록된 공지가 없습니다.'}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800">
            {items.map((item) => {
              const pinned = isPinnedNotice(item)
              const category = noticeCategoryLabel(item.category)
              return (
                <li key={item._id} className={pinned ? 'bg-brand-50/50 dark:bg-indigo-500/5' : ''}>
                  <Link
                    to={noticeItemPath(item._id)}
                    // 상세의 "← 공지사항" 이 보던 페이지로 돌아가도록
                    state={{ from: location.pathname + location.search }}
                    className="block space-y-1 px-4 py-3 no-underline text-inherit hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                      {pinned && (
                        <span title="고정 공지" aria-label="고정 공지">
                          📌
                        </span>
                      )}
                      {category && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-normal bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {category}
                        </span>
                      )}
                      <span className="truncate">{item.title}</span>
                      {item.attaches.length > 0 && (
                        <ImageIcon
                          size={16}
                          label={`사진 ${item.attaches.length}장`}
                          className="shrink-0 text-neutral-400 dark:text-neutral-500"
                        />
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <time dateTime={String(item.createdAt)}>
                        {formatDateTime(item.createdAt)}
                      </time>
                      <BoardItemCounts item={item} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      ) : null}

      {res?.success ? <Pagination page={page} maxPage={Math.max(maxPage, page)} /> : null}
    </div>
  )
}
