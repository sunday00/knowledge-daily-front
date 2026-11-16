import { Link } from 'react-router-dom'
import type { QuizListQuery } from '@/graphql/__generated__/graphql.ts'
import { quizEditPath, quizPath } from '@/lib/quiz.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { TagChips } from '@/components/TagChips.tsx'
import { QuizMyStatusBadge } from '@/components/quiz/QuizMyStatusBadge.tsx'
import { UserNickname } from '@/components/profile/UserNickname.tsx'
import { SayIcon } from '@/components/SayIcon.tsx'
import { reactionOf, sortReactions } from '@/lib/reactions.ts'
import { MaskedText } from '@/components/MaskedText.tsx'
import { maskedNoticeOf } from '@/lib/blockedContent.ts'

export type QuizListItem = QuizListQuery['QuizQuery']['quizList']['items'][number]

/** 제목 링크를 카드 전체로 늘려(after) 어디를 눌러도 풀기로. 태그·버튼은 그 위(z-1)에 둔다. */
export function QuizCard({ item, mine }: { item: QuizListItem; mine: boolean }) {
  const masked = !!maskedNoticeOf(item.title, '퀴즈')
  return (
    <li
      className={`relative rounded-md border border-neutral-200 dark:border-neutral-800 p-4 transition-colors ${
        masked ? '' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold">
          {masked ? (
            // 차단 / 삭제된 퀴즈는 풀기로 가지 않는다
            <MaskedText value={item.title} noun="퀴즈" />
          ) : (
            <Link
              to={quizPath(item._id)}
              className="text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
            >
              <MaskedText value={item.title} noun="퀴즈" />
            </Link>
          )}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <QuizMyStatusBadge status={item.me?.status} />
          <span className="rounded px-1.5 py-0.5 text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
            {item.quizItemsCnt.toLocaleString()}문항
          </span>
        </div>
      </div>
      {/* 제목이 가려졌으면(삭제 / 차단) 소개도 숨긴다 */}
      {item.brief && !masked && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.brief}</p>
      )}
      <TagChips tags={item.tags} className="relative z-1 mt-2" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs text-neutral-500">
            {item.user && (
              <span>
                <UserNickname user={item.user} /> ·{' '}
              </span>
            )}
            {formatDateTime(item.createdAt)}
          </p>
          <QuizCounts item={item} />
        </div>
        <div className={`relative z-1 flex gap-1 ${masked ? 'hidden' : ''}`}>
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

/** 반응(이모지별 수, 0 은 빼고 긍정 → 부정 순)과 댓글(의견) 수. 게시판 목록(BoardItemCounts)과 같은 모양 */
function QuizCounts({ item }: { item: QuizListItem }) {
  const reactions = sortReactions((item.reactionsCnt ?? []).filter((r) => r.cnt > 0))
  // opinionsCnt = [대화 수, 의견 수]
  const opinionCnt = item.opinionsCnt?.[1] ?? 0
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
      {reactions.map((r) => {
        const { emoji, label } = reactionOf(r.name)
        return (
          <span
            key={r.name}
            title={`${label} ${r.cnt}`}
            className="inline-flex items-center gap-0.5 tabular-nums"
          >
            <span aria-hidden>{emoji}</span>
            <span className="sr-only">{label}</span>
            {r.cnt}
          </span>
        )
      })}
      <span title="댓글 수" className="inline-flex items-center gap-1 tabular-nums">
        <SayIcon size={14} label="댓글 수" />
        {opinionCnt}
      </span>
    </p>
  )
}
