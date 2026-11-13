import { useId } from 'react'

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  /** 칸 바로 아래에 보여 줄 에러 (금칙어 등). 있으면 테두리도 빨갛게 */
  error?: string | null
}

export function NicknameField({ value, onChange, disabled, error }: Props) {
  const errorId = useId()
  return (
    <label className="block">
      <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">닉네임</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={40}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-white dark:bg-neutral-900 px-3 py-2 outline-none ${
          error
            ? 'border-red-400 focus:border-red-500 dark:border-red-700'
            : 'border-neutral-300 dark:border-neutral-700 focus:border-brand-500'
        }`}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400"
        >
          <span aria-hidden>⚠️</span>
          {error}
        </span>
      )}
    </label>
  )
}
