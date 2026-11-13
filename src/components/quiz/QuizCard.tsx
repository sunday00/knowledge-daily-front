import { Link } from 'react-router-dom'
import type { QuizListQuery } from '@/graphql/__generated__/graphql.ts'
import { quizEditPath, quizPath } from '@/lib/quiz.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { TagChips } from '@/components/TagChips.tsx'
import { QuizMyStatusBadge } from '@/components/quiz/QuizMyStatusBadge.tsx'
import { UserNickname } from '@/components/profile/UserNickname.tsx'

export type QuizListItem = QuizListQuery['QuizQuery']['quizList']['items'][number]

/** 제목 링크를 카드 전체로 늘려(after) 어디를 눌러도 풀기로. 태그·버튼은 그 위(z-1)에 둔다. */
export function QuizCard({ item, mine }: { item: QuizListItem; mine: boolean }) {
  return (
    <li className="relative rounded-md border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold">
          <Link
            to={quizPath(item._id)}
            className="text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
          >
            {item.title}
          </Link>
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <QuizMyStatusBadge status={item.me?.status} />
          <span className="rounded px-1.5 py-0.5 text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
            {item.quizItemsCnt.toLocaleString()}문항
          </span>
        </div>
      </div>
      {item.brief && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.brief}</p>
      )}
      <TagChips tags={item.tags} className="relative z-1 mt-2" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {item.user && (
            <span>
              <UserNickname user={item.user} /> ·{' '}
            </span>
          )}
          {formatDateTime(item.createdAt)}
        </p>
        <div className="relative z-1 flex gap-1">
          {mine && (
            <Link to={quizEditPath(item._id)} className="btn text-xs px-2 py-1 no-underline">
              수정
            </Link>
          )}
          <Link
            to={quizPath(item._id)}
            className="btn text-xs px-2 py-1 no-underline bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            풀기
          </Link>
        </div>
      </div>
    </li>
  )
}
