type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function NicknameField({ value, onChange, disabled }: Props) {
  return (
    <label className="block">
      <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">닉네임</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={40}
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
      />
    </label>
  )
}
