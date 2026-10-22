import { Link } from 'react-router-dom'

type Props = {
  tags: { _id: string; name: string }[]
  className?: string
}

export function TagChips({ tags, className = '' }: Props) {
  if (tags.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <li key={t._id}>
          <Link
            to={`/sense/tag/${encodeURIComponent(t.name)}`}
            className="text-xs rounded-full px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 dark:hover:bg-neutral-700 hover:text-brand-700 dark:hover:text-brand-500 no-underline transition-colors"
          >
            #{t.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
