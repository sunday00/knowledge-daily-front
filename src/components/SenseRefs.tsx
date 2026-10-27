import { BrandIcon } from '@/components/BrandIcon.tsx'

type Ref = { href: string; label: string }

/** 상식의 출처(refs) 링크 목록. 새 탭으로 연다 */
export function SenseRefs({ refs }: { refs: Ref[] }) {
  if (refs.length === 0) return null

  return (
    <section className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
      <h3 className="text-sm font-semibold text-neutral-500">출처</h3>
      <ul className="space-y-1.5 text-sm">
        {refs.map((ref) => (
          <li key={ref.href} className="flex min-w-0 items-center gap-2">
            <BrandIcon href={ref.href} size={16} />
            <a
              href={ref.href}
              target="_blank"
              rel="noreferrer noopener"
              title={ref.href}
              className="min-w-0 truncate text-brand-600 hover:text-brand-700 dark:text-brand-500 underline"
            >
              {ref.label || ref.href}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
