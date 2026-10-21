type Props = {
  /** 'HH' (00~23) */
  value: string
  onChange: (next: string) => void
  fromUtcH?: string
  disabled?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))

export function NotiHourField({ value, onChange, fromUtcH, disabled }: Props) {
  return (
    <label className="block">
      <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">
        알림 시간
        {fromUtcH && <span className="ml-2 text-neutral-500">(UTC{fromUtcH} 기준)</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
      >
        <option value="" disabled>
          선택
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
    </label>
  )
}
