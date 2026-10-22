import { Link } from 'react-router-dom'
import type { ThreadStandardListQuery } from '@/graphql/__generated__/graphql.ts'
import { SayIcon } from '@/components/SayIcon.tsx'
import { formatDateTime } from '@/lib/formatDate.ts'
import { OpinionTypeBadge } from '@/components/OpinionTypeBadge.tsx'

export type ThreadListItem =
  ThreadStandardListQuery['OpinionQuery']['threadStandardList']['items'][number]

export const threadPath = (senseId: string, threadId: string) =>
  `/sense/${senseId}/threads/${threadId}`

/** 대화록 한 건: 첫 의견(opinion)과 그 대화의 의견 수. 누르면 의견 목록 페이지로 이동. */
export function ThreadItem({ thread, senseId }: { thread: ThreadListItem; senseId: string }) {
  const { opinion } = thread

  return (
    // 내용 링크를 카드 전체로 늘려(after) 어디를 눌러도 이동
    <li className="relative rounded-md border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
          {opinion.user?.nickname ?? '알 수 없음'}
        </span>
        <time dateTime={String(opinion.createdAt)} className="shrink-0">
          {formatDateTime(opinion.createdAt)}
        </time>
      </div>
      <Link
        to={threadPath(senseId, thread._id)}
        className="mt-2 block whitespace-pre-wrap break-words text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
      >
        <OpinionTypeBadge type={opinion.type} />
        {opinion.content}
      </Link>
      <div className="mt-2 flex justify-end text-xs text-neutral-500">
        <span title="의견수" className="inline-flex items-center gap-1">
          <SayIcon size={16} label="의견수" />
          {thread.opinionsCnt}
        </span>
      </div>
    </li>
  )
}
