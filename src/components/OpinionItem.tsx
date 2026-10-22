import type { OpinionStandardListQuery } from '@/graphql/__generated__/graphql.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { OpinionTypeBadge } from '@/components/OpinionTypeBadge.tsx'

export type OpinionListItem =
  OpinionStandardListQuery['OpinionQuery']['opinionStandardList']['items'][number]

export function OpinionItem({ opinion }: { opinion: OpinionListItem }) {
  return (
    <li className="rounded-md border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
          {opinion.user?.nickname ?? '알 수 없음'}
        </span>
        <time dateTime={String(opinion.createdAt)} className="shrink-0">
          {formatDateTime(opinion.createdAt)}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words">
        <OpinionTypeBadge type={opinion.type} />
        {opinion.content}
      </p>
    </li>
  )
}
