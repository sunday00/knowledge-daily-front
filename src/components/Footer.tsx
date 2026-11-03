import { Link } from 'react-router-dom'
import { DOCUMENTS, documentPath } from '@/lib/documents.ts'

/** 모든 페이지 맨 아래 */
export function Footer() {
  return (
    <footer className="mt-16 space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center text-xs text-neutral-500">
      <p>© GTS® All rights reserved.</p>
      <nav aria-label="사이트 정보" className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {DOCUMENTS.map(({ slug, label, strong }) => (
          <Link
            key={slug}
            to={documentPath(slug)}
            className={`hover:text-neutral-800 dark:hover:text-neutral-200 hover:underline ${
              strong ? 'font-semibold text-neutral-700 dark:text-neutral-300' : ''
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
