import { Link, useLocation } from 'react-router-dom'

/** 밑줄 탭. 탭마다 지금 주소에 toParams 의 쿼리를 붙여 이동한다 (기록 / 차단·신고 관리) */
export function UnderlineTabs<K extends string>({
  label,
  items,
  current,
  toParams,
}: {
  label: string
  items: readonly { key: K; label: string }[]
  current: K
  toParams: (key: K) => Record<string, string>
}) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
    >
      {items.map((t) => {
        const active = t.key === current
        const to = `${pathname}?${new URLSearchParams(toParams(t.key)).toString()}`
        return (
          <Link
            key={t.key}
            to={to}
            replace
            aria-current={active ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm no-underline transition-colors ${
              active
                ? 'border-brand-600 font-medium text-brand-600 dark:border-indigo-300 dark:text-indigo-300'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
