import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ARTICLE_ONE_QUERY } from '@/graphql/queries/board.ts'
import type { ArticleOneQuery } from '@/graphql/__generated__/graphql.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { boardPath, findBoardBySlug, type BoardConfig } from '@/lib/boards.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'

export type ArticleOneItem = ArticleOneQuery['BoardQuery']['articleOne']['item']

/** 글에 붙일 기능. 서버가 글마다 components 로 알려준다. */
export const hasArticleComponent = (item: ArticleOneItem, name: 'Reaction' | 'Opinion') =>
  !!item.components?.includes(name)

/** 게시글 한 건 조회 (상세, 수정 화면 공용) */
export function useArticleOne(id: string) {
  const { data, loading, error } = useQuery(ARTICLE_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
  })
  const res = data?.BoardQuery.articleOne
  return { res, item: res?.success ? res.item : null, loading: loading && !res, error }
}

/**
 * 게시글 한 건: 제목, 작성자, 본문(마크다운), (Reaction 이면) 리액션 줄.
 * 내 글이면 수정 버튼. 그 아래 내용(대화록 등)은 children 으로 그린다.
 */
export function ArticleOneView({
  slug,
  id,
  children,
}: {
  slug: string
  id: string
  children?: (item: ArticleOneItem, board: BoardConfig) => ReactNode
}) {
  const board = findBoardBySlug(slug)
  const location = useLocation()
  const state = location.state as { from?: string; created?: boolean; updated?: boolean } | null
  const { user } = useAuth()
  const { res, item, loading, error } = useArticleOne(id)

  if (!board) return <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>

  const categoryLabel = (code: string) =>
    board.categories?.find((c) => c.code === code)?.label ?? code
  const mine = !!user && !!item?.user && item.user._id === user.userId

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div className={`space-y-8 ${item && hasArticleComponent(item, 'Opinion') ? 'pb-32' : ''}`}>
      <article className="space-y-4">
        {/* 목록에서 왔으면 보던 페이지(?page=)로 돌아간다. */}
        <Link to={state?.from ?? boardPath(board)} className="text-sm no-underline">
          ← {board.label || board.title}
        </Link>

        {loading && <p className="text-neutral-500">불러오는 중...</p>}
        {/* 없는 글이면 서버가 item null 오류를 돌려준다. */}
        {error && !res && <p className="text-neutral-500">글을 찾을 수 없습니다.</p>}
        {res && !res.success && (
          <p className="text-red-600 dark:text-red-400">
            {res.message ?? '글을 찾을 수 없습니다.'}
          </p>
        )}
        {(state?.created || state?.updated) && (
          <p role="status" className="text-sm text-brand-700 dark:text-indigo-300">
            {state.created ? '글이 등록되었습니다.' : '글이 수정되었습니다.'}
          </p>
        )}

        {item && (
          <>
            <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="flex items-start gap-2 text-2xl font-semibold">
                {item.pinn && (
                  <span title="고정글" aria-label="고정글">
                    📌
                  </span>
                )}
                <span className="min-w-0 break-words">{item.title}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                {item.category && (
                  <span className="rounded px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {categoryLabel(item.category)}
                  </span>
                )}
                <span>{item.user?.nickname ?? '알 수 없음'}</span>
                <time dateTime={String(item.createdAt)}>{formatDateTime(item.createdAt)}</time>
                {mine && (
                  <Link
                    to={`${boardPath(board)}/${item._id}/edit`}
                    className="btn ml-auto text-sm no-underline"
                  >
                    ✏️ 수정
                  </Link>
                )}
              </div>
            </header>

            {/* 이미지는 본문에 넣은 것만 보인다. 넣지 않은 첨부는 수정 화면에서 다시 넣을 수 있다. */}
            <MarkdownView>{item.content}</MarkdownView>

            {hasArticleComponent(item, 'Reaction') && (
              <ReactionBar target={{ entity: 'Article', id: item._id }} />
            )}
          </>
        )}
      </article>

      {item && children?.(item, board)}
    </div>
  )
}
