import type { BoardConfig } from '@/lib/boards.ts'

type Category = NonNullable<BoardConfig['categories']>[number]

/**
 * 게시판 분류 선택. 몇 개뿐이라 드롭다운 대신 칩으로 고른다.
 * 실제로는 라디오라 방향키로도 이동하고, required 면 브라우저가 선택을 요구한다.
 */
export function CategoryChips({
  categories,
  value,
  onChange,
  disabled,
  required,
}: {
  categories: Category[]
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  required?: boolean
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm text-neutral-700 dark:text-neutral-300">분류</legend>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <label key={c.code} className="cursor-pointer">
            <input
              type="radio"
              name="category"
              value={c.code}
              checked={value === c.code}
              onChange={() => onChange(c.code)}
              required={required}
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-colors border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-indigo-300 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white dark:peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/50 peer-disabled:opacity-60">
              {c.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
