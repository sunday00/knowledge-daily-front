import { BrandIcon } from './BrandIcon'

type Props = {
  href: string
  label?: string | null
}

export function LinkItem({ href, label }: Props) {
  return (
    <li className="flex items-center gap-2 min-w-0">
      <BrandIcon href={href} size={16} />
      {label && <span className="shrink-0 text-neutral-700 dark:text-neutral-300">{label}:</span>}
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        title={href}
        className="truncate flex-1 min-w-0 text-brand-600 hover:text-brand-700 visited:text-purple-700 dark:visited:text-indigo-300 underline"
      >
        {href}
      </a>
    </li>
  )
}
