import type { ComplaintResult } from '@/graphql/__generated__/graphql.ts'

const RESULT: Record<ComplaintResult, { label: string; className: string }> = {
  IDLE: {
    label: '대기중',
    className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  },
  ACCEPT: {
    label: '처리됨',
    className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  PART: {
    label: '일부 처리',
    className: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  DENY: {
    label: '반려',
    className: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
  },
  CANCELED: {
    label: '취소',
    className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 line-through',
  },
}

/** 문의/요청 처리 결과 뱃지 */
export function AskResultBadge({ result }: { result: ComplaintResult }) {
  const r = RESULT[result] ?? RESULT.IDLE
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.className}`}>
      {r.label}
    </span>
  )
}
