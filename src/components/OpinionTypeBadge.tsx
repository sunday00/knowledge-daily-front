import { OPINION_TYPES } from '@/lib/opinionTypes.ts'

// 말머리별 색. 목록에 없는 값은 기본(회색)
const TONE: Record<string, string> = {
  supplement: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  objection: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  level: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  exclude: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  source: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  chat: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
}
const DEFAULT_TONE = 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'

/** 말머리 뱃지. 본문 맨 앞에 인라인으로 두면 본문이 바로 이어진다. 말머리가 없으면 그리지 않는다. */
export function OpinionTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null
  // 모르는 값은 그대로 보여준다
  const label = OPINION_TYPES.find((t) => t.value === type)?.label ?? type

  return (
    <span
      className={`mr-1.5 inline-block rounded px-1.5 py-0.5 align-[0.1em] text-xs font-medium leading-none ${TONE[type] ?? DEFAULT_TONE}`}
    >
      {label}
    </span>
  )
}
