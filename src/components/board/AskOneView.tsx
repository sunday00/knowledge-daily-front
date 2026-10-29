import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ASK_ONE_QUERY } from '@/graphql/queries/board.ts'
import type { AskOneQuery } from '@/graphql/__generated__/graphql.ts'
import { boardPath, findBoardBySlug, type BoardConfig } from '@/lib/boards.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { AskResultBadge } from '@/components/board/AskResultBadge.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'

export type AskOneItem = AskOneQuery['BoardQuery']['askOne']['item']

/** 글에 붙일 기능. 서버가 글마다 components 로 알려준다. */
export const hasComponent = (item: AskOneItem, name: 'Reaction' | 'Opinion') =>
  !!item.components?.includes(name)

/**
 * 문의/요청 글 한 건을 받아 본문(+ Reaction 이면 리액션 줄)을 그리고,
 * 그 아래 내용(대화록 등)은 children 으로 그린다.
 */
export function AskOneView({
  slug,
  id,
  children,
}: {
  slug: string
  id: string
  children?: (item: AskOneItem, board: BoardConfig) => ReactNode
}) {
  const board = findBoardBySlug(slug)
  // 목록에서 왔으면 보던 페이지(?page=)로 돌아간다.
  const from = (useLocation().state as { from?: string } | null)?.from
  const { data, loading, error } = useQuery(ASK_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
  })
  const res = data?.BoardQuery.askOne
  const item = res?.success ? res.item : null

  if (!board) return <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>

  const categoryLabel = (code: string) =>
    board.categories?.find((c) => c.code === code)?.label ?? code

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div className={`space-y-8 ${item && hasComponent(item, 'Opinion') ? 'pb-32' : ''}`}>
      <article className="space-y-4">
        <Link to={from ?? boardPath(board)} className="text-sm no-underline">
          ← {board.label || board.title}
        </Link>

        {loading && !res && <p className="text-neutral-500">불러오는 중...</p>}
        {/* 없는 글이면 서버가 item null 오류를 돌려준다. */}
        {error && !res && <p className="text-neutral-500">글을 찾을 수 없습니다.</p>}
        {res && !res.success && (
          <p className="text-red-600 dark:text-red-400">
            {res.message ?? '글을 찾을 수 없습니다.'}
          </p>
        )}

        {item && (
          <>
            <header className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span className="rounded px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {categoryLabel(item.category)}
              </span>
              <AskResultBadge result={item.result} />
              <time className="ml-auto" dateTime={String(item.createdAt)}>
                {formatDateTime(item.createdAt)}
              </time>
            </header>

            <p className="whitespace-pre-wrap break-words leading-relaxed">{item.quest}</p>

            {hasComponent(item, 'Reaction') && (
              <ReactionBar target={{ entity: 'Ask', id: item._id }} />
            )}

            <section className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">
                답변
                {item.handledAt ? (
                  <time
                    className="text-xs font-normal text-neutral-500"
                    dateTime={String(item.handledAt)}
                  >
                    {formatDateTime(item.handledAt)}
                  </time>
                ) : null}
              </h3>
              {item.answer ? (
                <p className="whitespace-pre-wrap break-words text-sm">{item.answer}</p>
              ) : (
                <p className="text-sm text-neutral-500">아직 답변이 없습니다.</p>
              )}
            </section>
          </>
        )}
      </article>

      {item && children?.(item, board)}
    </div>
  )
}
