export type LevelRange = [min: number, max: number]

type Props = {
  value: LevelRange
  onChange: (next: LevelRange) => void
  disabled?: boolean
}

// 서버 기본값 [1, 5] 기준
export const LV_MIN = 1
export const LV_MAX = 5
const LEVELS = Array.from({ length: LV_MAX - LV_MIN + 1 }, (_, i) => LV_MIN + i)

const selectClass =
  'rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500'

export function LevelRangeField({ value, onChange, disabled }: Props) {
  const [min, max] = value

  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="mb-1 text-sm text-neutral-700 dark:text-neutral-300">수준</legend>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block mb-1 text-xs text-neutral-500">최소 수준</span>
          <select
            value={min}
            onChange={(e) => onChange([Number(e.target.value), max])}
            className={selectClass}
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv} disabled={lv > max}>
                Lv.{lv}
              </option>
            ))}
          </select>
        </label>
        <span className="pb-2 text-neutral-500">~</span>
        <label className="block">
          <span className="block mb-1 text-xs text-neutral-500">최고 수준</span>
          <select
            value={max}
            onChange={(e) => onChange([min, Number(e.target.value)])}
            className={selectClass}
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv} disabled={lv < min}>
                Lv.{lv}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}
