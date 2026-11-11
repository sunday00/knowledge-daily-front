const STEPS = ['퀴즈 세트', '문항 만들기'] as const

/** 퀴즈 만들기 단계 표시 (1: 퀴즈 세트, 2: 문항) */
export function QuizSteps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((label, i) => {
        const step = i + 1
        const active = step === current
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            {i > 0 && (
              <span aria-hidden className="text-neutral-300 dark:text-neutral-700">
                —
              </span>
            )}
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
              }`}
            >
              {step}
            </span>
            <span
              className={
                active ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'
              }
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
