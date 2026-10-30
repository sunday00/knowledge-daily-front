import { Link, useLocation } from 'react-router-dom'
import {
  useAdjacentArticle,
  useAdjacentAsk,
  useAdjacentNotice,
  type Adjacent,
  type AdjacentLink,
} from '@/hooks/useAdjacent.ts'
import type { BoardConfig } from '@/lib/boards.ts'

export const AskAdjacentNav = ({ board, id }: { board: BoardConfig; id: string }) => (
  <AdjacentNav {...useAdjacentAsk(board, id)} />
)

export const ArticleAdjacentNav = ({ board, id }: { board: BoardConfig; id: string }) => (
  <AdjacentNav {...useAdjacentArticle(board, id)} />
)

export const NoticeAdjacentNav = ({ id }: { id: string }) => (
  <AdjacentNav {...useAdjacentNotice(id)} />
)

/**
 * 상세 화면 아래 이전글/다음글 바로가기. (공지, 문의/요청, 게시글 공용)
 * 다음글(더 새 글)을 위, 이전글(더 오래된 글)을 아래에 둔다. 목록의 최신순 배치와 같다.
 */
export function AdjacentNav({ prev, next, loading }: Adjacent) {
  // 옮겨 가도 "← 목록" 이 처음 보던 목록 페이지로 돌아가도록 넘겨받은 state 를 이어 준다.
  const state = useLocation().state as { from?: string } | null
  const from = state?.from ? { from: state.from } : undefined
  if (loading) return null

  return (
    <nav
      aria-label="이전글/다음글"
      className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm"
    >
      <Row label="다음글" icon="▲" link={next} state={from} />
      <Row label="이전글" icon="▼" link={prev} state={from} />
    </nav>
  )
}

function Row({
  label,
  icon,
  link,
  state,
}: {
  label: string
  icon: string
  link: AdjacentLink
  state?: { from: string }
}) {
  const head = (
    <span className="flex w-20 shrink-0 items-center gap-1.5 text-neutral-500">
      <span aria-hidden className="text-xs">
        {icon}
      </span>
      {label}
    </span>
  )

  if (!link) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5">
        {head}
        <span className="text-neutral-400 dark:text-neutral-500">
          {label === '다음글' ? '다음 글이 없습니다.' : '이전 글이 없습니다.'}
        </span>
      </div>
    )
  }
  return (
    <Link
      to={link.to}
      state={state}
      className="flex items-center gap-2 px-4 py-2.5 no-underline text-inherit hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
    >
      {head}
      <span className="min-w-0 truncate text-neutral-800 dark:text-neutral-200">{link.title}</span>
    </Link>
  )
}
