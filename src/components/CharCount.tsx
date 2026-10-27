import { OPINION_MAX_LENGTH } from '@/lib/opinionLimits.ts'

/** 글자 수 n/max(기본 의견 300자). 한도에 가까우면 색으로 알린다 */
export function CharCount({ length, max = OPINION_MAX_LENGTH }: { length: number; max?: number }) {
  const tone =
    length >= max
      ? 'text-red-600 dark:text-red-400'
      : length >= max * 0.9
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-neutral-400'
  return (
    <span className={`ml-auto shrink-0 text-xs tabular-nums ${tone}`} aria-live="polite">
      {length}/{max}
    </span>
  )
}
