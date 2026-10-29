import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ARTICLE_LIST_QUERY } from '@/graphql/queries/board.ts'
import { boardPath, type BoardConfig } from '@/lib/boards.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { BoardItemCounts } from '@/components/board/BoardItemCounts.tsx'
import { Pagination, usePageParam } from '@/components/Pagination.tsx'
import { ImageIcon } from '@/components/ImageIcon.tsx'

const PAGE_SIZE = 20

/** 게시판(article)의 글 목록 (최신순, ?page= 페이지 이동). 고정글은 📌 */
export function ArticleList({ board }: { board: BoardConfig }) {
  const page = usePageParam()
  const location = useLocation()
  // board 는 ObjectId 로 저장돼 있어 complex.id 로 변환해 검색해야 한다.
  const input = {
    size: PAGE_SIZE,
    page,
    search: { board: { eq: board._id }, complex: { id: ['board'] } },
    sort: { _id: -1 },
  }
  const { data, previousData, loading, error } = useQuery(ARTICLE_LIST_QUERY, {
    variables: { input },
    // 글을 쓰고 돌아왔을 때 새 글이 보이도록 캐시를 보여준 뒤 다시 받는다.
    fetchPolicy: 'cache-and-network',
  })
  // 페이지를 옮기는 동안엔 이전 페이지를 그대로 두어 화면이 비지 않게 한다.
  const res = (data ?? previousData)?.BoardQuery.articleList
  const maxPage = res?.maxPage || Math.ceil((res?.total ?? 0) / PAGE_SIZE)
  const categoryLabel = (code: string) =>
    board.categories?.find((c) => c.code === code)?.label ?? code

  return (
    <div className={`space-y-3 ${loading && res ? 'opacity-60' : ''}`}>
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
                  <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                    {item.pinn && (
                      <span title="고정글" aria-label="고정글">
                        📌
                      </span>
                    )}
                    {item.category && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-normal bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {categoryLabel(item.category)}
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
                    <span>{item.user?.nickname ?? '알 수 없음'}</span>
                    <time dateTime={String(item.createdAt)}>{formatDateTime(item.createdAt)}</time>
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
