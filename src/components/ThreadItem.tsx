import { Link } from 'react-router-dom'
import type { ThreadStandardListQuery } from '@/graphql/__generated__/graphql.ts'
import { SayIcon } from '@/components/SayIcon.tsx'
import { formatDateTime } from '@/lib/formatDate.ts'
import { isDeletedOpinion } from '@/lib/opinionStatus.ts'
import { blockedAwareContent, maskBlocked } from '@/lib/blockedContent.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { ReportedMark } from '@/components/ReportedMark.tsx'
import { OpinionVillainMenu, UserVillainMenu } from '@/components/OpinionVillainMenu.tsx'
import { opinionDomId } from '@/lib/scrollToOpinion.ts'
import { OpinionTypeBadge } from '@/components/OpinionTypeBadge.tsx'

export type ThreadListItem =
  ThreadStandardListQuery['OpinionQuery']['threadStandardList']['items'][number]

export const threadPath = (senseId: string, threadId: string) =>
  `/sense/${senseId}/threads/${threadId}`

/** 대화록 한 건: 첫 의견(opinion)과 그 대화의 의견 수. 누르면 의견 목록 페이지로 이동. */
export function ThreadItem({
  thread,
  senseId,
  isNew = false,
}: {
  thread: ThreadListItem
  senseId: string
  /** 이번 화면에서 방금 시작한 대화면 테두리를 살짝 강조 */
  isNew?: boolean
}) {
  const { opinion } = thread
  const { user } = useAuth()
  // 남의 의견이면 차단/신고 (로그인했을 때만)
  const others =
    !!user && !!opinion.user && opinion.user._id !== user.userId && !isDeletedOpinion(opinion)

  return (
    // 내용 링크를 카드 전체로 늘려(after) 어디를 눌러도 이동
    <li
      id={opinionDomId(opinion._id)}
      className={`relative rounded-md border p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors ${isNew ? 'border-brand-500/50 dark:border-brand-500/60' : 'border-neutral-200 dark:border-neutral-800'}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex min-w-0 items-center font-medium text-neutral-700 dark:text-neutral-300">
          {/* 남의 의견이면 닉네임을 눌러 그 유저를 차단/신고 */}
          {others && opinion.user ? (
            <UserVillainMenu user={opinion.user} />
          ) : (
            <span className="truncate">{opinion.user?.nickname ?? '알 수 없음'}</span>
          )}
          <span className="ml-1 shrink-0 font-normal text-neutral-400">@{opinion.sid}</span>
          <ReportedMark villainStatus={opinion.villainStatus} user={opinion.user} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <time dateTime={String(opinion.createdAt)}>{formatDateTime(opinion.createdAt)}</time>
          {others && <OpinionVillainMenu opinion={opinion} />}
        </div>
      </div>
      <Link
        to={threadPath(senseId, thread._id)}
        className="mt-2 block whitespace-pre-wrap break-words text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
      >
        <ThreadContent opinion={opinion} />
      </Link>
      <div className="mt-2 flex items-start justify-between gap-2 text-xs text-neutral-500">
        <ReactionBar target={{ entity: 'Thread', id: thread._id }} />
        <span title="의견수" className="ml-auto inline-flex shrink-0 items-center gap-1">
          <SayIcon size={16} label="의견수" />
          {thread.opinionsCnt}
        </span>
      </div>
    </li>
  )
}

function ThreadContent({ opinion }: { opinion: ThreadListItem['opinion'] }) {
  if (isDeletedOpinion(opinion)) {
    return <span className="text-sm italic text-neutral-400">삭제된 의견입니다.</span>
  }
  return (
    <>
      <OpinionTypeBadge type={opinion.type} />
      {maskBlocked(blockedAwareContent(opinion))}
    </>
  )
}
