import { forwardRef } from 'react'
import { OPINION_TYPES, type OpinionType } from '@/lib/opinionTypes.ts'

type Props = {
  value: OpinionType
  onChange: (next: OpinionType) => void
  disabled?: boolean
}

/** 말머리 선택 */
export const OpinionTypeSelect = forwardRef<HTMLSelectElement, Props>(function OpinionTypeSelect(
  { value, onChange, disabled },
  ref,
) {
  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value as OpinionType)}
      disabled={disabled}
      aria-label="말머리"
      className="shrink-0 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-2 outline-none focus:border-brand-500"
    >
      {OPINION_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  )
})
