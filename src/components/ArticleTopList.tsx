import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import { ARTICLE_OPINION_TOP_QUERY, ARTICLE_REACTION_TOP_QUERY } from '@/graphql/queries/top.ts'
import type { ArticleReactionTopQuery } from '@/graphql/__generated__/graphql.ts'
import { POPULAR_REACTION_CODES } from '@/lib/reactions.ts'
import { boardPath, findBoardById } from '@/lib/boards.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { BoardItemCounts } from '@/components/board/BoardItemCounts.tsx'
import { ImageIcon } from '@/components/ImageIcon.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

type Target = ArticleReactionTopQuery['ReactionQuery']['reactionTopList']['items'][number]['target']
type ArticleItem = Exclude<NonNullable<Target>, Record<PropertyKey, never>>
type TopResult = {
  success: number
  message?: string | null
  // target 은 Article 이 아니면 빈 객체, 삭제됐으면 null
  items: { targetId: string; target: Target }[]
}

const isArticle = (t: Target): t is ArticleItem => !!t && '_id' in t && 'title' in t

// 삭제된 글이나 없어진 게시판의 글은 건너뛰므로 넉넉히 받아 size 만큼 보인다.
const OVERFETCH = 3

/** 순위 목록 공통 화면. 삭제된 글, 공용 설정에 없는 게시판의 글은 건너뛴다. */
function RankedArticles({
  res,
  loading,
  error,
  size,
  empty,
}: {
  res: TopResult | undefined
  loading: boolean
  error?: Error
  size: number
  empty: string
}) {
  if (loading && !res) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!res || !res.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res?.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }

  const rows = res.items
    .map((i) => i.target)
    .filter(isArticle)
    .flatMap((article) => {
      const board = findBoardById(article.board)
      return board ? [{ article, board }] : []
    })
    .slice(0, size)
  if (rows.length === 0) return <p className="text-neutral-500">{empty}</p>

  return (
    <ol className="space-y-2">
      {rows.map(({ article, board }, i) => (
        <li key={article._id}>
          <ArticleRow
            to={`${boardPath(board)}/${article._id}`}
            article={article}
            boardLabel={board.label || board.title}
            rank={i + 1}
          />
        </li>
      ))}
    </ol>
  )
}

function ArticleRow({
  to,
  article,
  boardLabel,
  rank,
}: {
  to: string
  article: ArticleItem
  boardLabel: string
  rank: number
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3 no-underline text-inherit hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
    >
      <span className="w-5 shrink-0 text-center text-lg font-bold tabular-nums text-brand-600 dark:text-indigo-300">
        {rank}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
          <span className="truncate">{article.title}</span>
          {article.attaches.length > 0 && (
            <ImageIcon
              size={16}
              label={`사진 ${article.attaches.length}장`}
              className="shrink-0 text-neutral-400 dark:text-neutral-500"
            />
          )}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="rounded px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {boardLabel}
          </span>
          <span>{article.user?.nickname ?? '알 수 없음'}</span>
          <time dateTime={String(article.createdAt)}>{formatDateTime(article.createdAt)}</time>
          <BoardItemCounts item={article} />
        </div>
      </div>
    </Link>
  )
}

/** 인기 게시글: 긍정 리액션 점수 상위 */
export function ArticlePopularList({ size }: { size: number }) {
  const { data, loading, error } = useQuery(ARTICLE_REACTION_TOP_QUERY, {
    variables: {
      input: { targetEntity: 'Article', names: POPULAR_REACTION_CODES, size: size + OVERFETCH },
    },
    fetchPolicy: 'cache-first',
  })
  return (
    <RankedArticles
      res={data?.ReactionQuery.reactionTopList}
      loading={loading}
      error={error}
      size={size}
      empty="아직 인기 게시글이 없습니다."
    />
  )
}

/** 댓글 많은 게시글: 의견 점수 상위 */
export function ArticleBuzzList({ size }: { size: number }) {
  const { data, loading, error } = useQuery(ARTICLE_OPINION_TOP_QUERY, {
    variables: { input: { targetEntity: 'Article', size: size + OVERFETCH } },
    fetchPolicy: 'cache-first',
  })
  return (
    <RankedArticles
      res={data?.OpinionQuery.opinionTopList}
      loading={loading}
      error={error}
      size={size}
      empty="아직 댓글이 오간 게시글이 없습니다."
    />
  )
}
