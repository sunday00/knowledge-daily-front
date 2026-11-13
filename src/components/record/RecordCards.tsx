import { Link } from 'react-router-dom'
import type {
  MyArticleListQuery,
  MyAskListQuery,
  MyOpinionListQuery,
} from '@/graphql/__generated__/graphql.ts'
import { AskResultBadge } from '@/components/board/AskResultBadge.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { formatDateTime } from '@/lib/formatDate.ts'
import { findBoardById } from '@/lib/boards.ts'
import { blockedAwareContent, maskBlocked } from '@/lib/blockedContent.ts'
import { isDeletedOpinion } from '@/lib/opinionStatus.ts'
import { articlePathOf } from '@/lib/myRecord.ts'

export type RecordArticle = MyArticleListQuery['BoardQuery']['articleList']['items'][number]
export type RecordAsk = MyAskListQuery['BoardQuery']['askList']['items'][number]
export type RecordOpinion =
  MyOpinionListQuery['OpinionQuery']['opinionStandardList']['items'][number]

const card = 'space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800'

/** 게시글 한 장: 제목(상세로) · 게시판 · 날짜 + 리액션 */
export function RecordArticleCard({ article }: { article: RecordArticle }) {
  const path = articlePathOf(article)
  const board = findBoardById(article.board)
  return (
    <li className={card}>
      {path ? (
        <Link
          to={path}
          className="block font-medium text-neutral-900 no-underline hover:underline dark:text-neutral-100"
        >
          {article.title}
        </Link>
      ) : (
        <p className="font-medium">{article.title}</p>
      )}
      <p className="flex flex-wrap gap-x-2 text-xs text-neutral-500">
        {board && <span>{board.title}</span>}
        <time dateTime={String(article.createdAt)}>{formatDateTime(article.createdAt)}</time>
      </p>
      <ReactionBar target={{ entity: 'Article', id: article._id }} />
    </li>
  )
}

/** 문의 / 요청 한 장: 내용 앞부분(상세로) · 분류 · 처리 결과 · 게시판 · 날짜 */
export function RecordAskCard({ ask }: { ask: RecordAsk }) {
  const path = articlePathOf(ask)
  const board = findBoardById(ask.board)
  const category = board?.categories?.find((c) => c.code === ask.category)?.label ?? ask.category
  const quest = <span className="line-clamp-2 whitespace-pre-wrap break-words">{ask.quest}</span>
  return (
    <li className={card}>
      {path ? (
        <Link
          to={path}
          className="block text-sm text-neutral-900 no-underline hover:underline dark:text-neutral-100"
        >
          {quest}
        </Link>
      ) : (
        <p className="text-sm">{quest}</p>
      )}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
        <AskResultBadge result={ask.result} />
        {category && <span>{category}</span>}
        {board && <span>{board.title}</span>}
        <time dateTime={String(ask.createdAt)}>{formatDateTime(ask.createdAt)}</time>
      </p>
    </li>
  )
}

/** 의견 한 장: 내용 앞부분 · 날짜 · 대화로 가기 + 리액션 */
export function RecordOpinionCard({
  opinion,
  path,
}: {
  opinion: RecordOpinion
  /** 이 의견이 있는 대화 주소. 아직 모르면 null */
  path: string | null | undefined
}) {
  const deleted = isDeletedOpinion(opinion)
  return (
    <li className={card}>
      {deleted ? (
        <p className="text-sm italic text-neutral-400">삭제된 의견입니다.</p>
      ) : (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-200">
          {maskBlocked(blockedAwareContent(opinion))}
        </p>
      )}
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
        <span>@{opinion.sid}</span>
        <time dateTime={String(opinion.createdAt)}>{formatDateTime(opinion.createdAt)}</time>
        {path && (
          <Link
            to={path}
            className="ml-auto text-brand-600 no-underline hover:underline dark:text-indigo-300"
          >
            대화 보기 →
          </Link>
        )}
      </p>
      {!deleted && <ReactionBar target={{ entity: 'Opinion', id: opinion._id }} />}
    </li>
  )
}

/** 반응한 대상이 지워졌거나 볼 수 없을 때 */
export function RecordMissingCard() {
  return (
    <li className={`${card} text-sm italic text-neutral-400`}>
      삭제되었거나 볼 수 없는 콘텐츠입니다.
    </li>
  )
}
