import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ASK_LIST_QUERY } from '@/graphql/queries/board.ts'
import { boardPath, type BoardConfig } from '@/lib/boards.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { AskResultBadge } from '@/components/board/AskResultBadge.tsx'
import { BoardItemCounts } from '@/components/board/BoardItemCounts.tsx'
import { Pagination, usePageParam } from '@/components/Pagination.tsx'

const PAGE_SIZE = 20

/** 문의/요청 게시판의 글 목록 (최신순, ?page= 페이지 이동) */
export function AskList({ board, action }: { board: BoardConfig; action?: ReactNode }) {
  const page = usePageParam()
  const location = useLocation()
  // board 는 ObjectId 로 저장돼 있어 complex.id 로 변환해 검색해야 한다.
  const input = {
    size: PAGE_SIZE,
    page,
    search: { board: { eq: board._id }, complex: { id: ['board'] } },
    sort: { _id: -1 },
  }
  const { data, previousData, loading, error } = useQuery(ASK_LIST_QUERY, {
    variables: { input },
    // 글을 쓰고 돌아왔을 때 새 글이 보이도록 캐시를 보여준 뒤 다시 받는다.
    fetchPolicy: 'cache-and-network',
  })
  // 페이지를 옮기는 동안엔 이전 페이지를 그대로 두어 화면이 비지 않게 한다.
  const res = (data ?? previousData)?.BoardQuery.askList
  const maxPage = res?.maxPage ?? Math.ceil((res?.total ?? 0) / PAGE_SIZE)
  const categoryLabel = (code: string) =>
    board.categories?.find((c) => c.code === code)?.label ?? code

  return (
    <div className={`space-y-3 ${loading && res ? 'opacity-60' : ''}`}>
      {/* 전체 글 수 + (오른쪽) 새 글 작성 등 */}
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="text-sm text-neutral-500">
          {res?.success ? `총 ${(res.total ?? 0).toLocaleString()}개` : null}
        </span>
        {action}
      </div>
      {loading && !res && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        res.items.length === 0 ? (
          <p className="text-neutral-500">
            {page > 1 ? '이 페이지에는 글이 없습니다.' : '아직 등록된 글이 없습니다.'}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800">
            {res.items.map((item) => (
              <li key={item._id}>
                <Link
                  to={`${boardPath(board)}/${item._id}`}
                  // 상세의 "← 목록" 이 보던 페이지로 돌아가도록
                  state={{ from: location.pathname + location.search }}
                  className="block space-y-1 px-4 py-3 no-underline text-inherit hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="rounded px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {categoryLabel(item.category)}
                    </span>
                    <AskResultBadge result={item.result} />
                    <time className="ml-auto" dateTime={String(item.createdAt)}>
                      {formatDateTime(item.createdAt)}
                    </time>
                  </div>
                  <p className="line-clamp-2 text-sm text-neutral-800 dark:text-neutral-200">
                    {item.quest}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {item.answer && (
                      <span className="text-brand-700 dark:text-indigo-300">💬 답변 있음</span>
                    )}
                    <BoardItemCounts item={item} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {res?.success ? <Pagination page={page} maxPage={Math.max(maxPage, page)} /> : null}
    </div>
  )
}
