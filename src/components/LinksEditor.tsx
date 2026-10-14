export type LinkDraft = { href: string; label: string }

export const emptyLink = (): LinkDraft => ({ href: '', label: '' })

type Props = {
  value: LinkDraft[]
  onChange: (next: LinkDraft[]) => void
  disabled?: boolean
}

export function LinksEditor({ value, onChange, disabled }: Props) {
  const updateAt = (idx: number, patch: Partial<LinkDraft>) =>
    onChange(value.map((l, i) => (i === idx ? { ...l, ...patch } : l)))

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const addRow = () => onChange([...value, emptyLink()])

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
        링크 <span className="text-neutral-500">(Instagram, X, 블로그 등)</span>
      </legend>

      {value.length === 0 && (
        <p className="text-sm text-neutral-500">아직 등록된 링크가 없습니다.</p>
      )}

      {value.map((l, i) => (
        <LinkEditRow
          key={i}
          value={l}
          disabled={disabled}
          onChange={(patch) => updateAt(i, patch)}
          onRemove={() => removeAt(i)}
        />
      ))}

      <button type="button" onClick={addRow} disabled={disabled} className="btn">
        + 링크 추가
      </button>
    </fieldset>
  )
}

type RowProps = {
  value: LinkDraft
  onChange: (patch: Partial<LinkDraft>) => void
  onRemove: () => void
  disabled?: boolean
}

function LinkEditRow({ value, onChange, onRemove, disabled }: RowProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
      <input
        type="url"
        value={value.href}
        onChange={(e) => onChange({ href: e.target.value })}
        disabled={disabled}
        placeholder="https://instagram.com/username"
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
      />
      <input
        type="text"
        value={value.label}
        onChange={(e) => onChange({ label: e.target.value })}
        disabled={disabled}
        placeholder="표시 이름 (선택)"
        maxLength={40}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="링크 삭제"
        className="btn h-full"
      >
        삭제
      </button>
    </div>
  )
}
