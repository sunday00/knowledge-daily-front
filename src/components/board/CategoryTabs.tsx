import { Link, useLocation, useSearchParams } from 'react-router-dom'

export type CategoryOption = { code: string; label: string }

/** 목록·상세 주소의 ?category= (게시판·공지 분류 탭). 목록에서 이 탭으로 들어온 글은 이전/다음도 이 분류 안에서. */
export const CATEGORY_PARAM = 'category'

/** 주소의 ?category=. categories 에 없는 분류면 전체(undefined) */
export function useCategoryParam(
  categories?: readonly CategoryOption[] | null,
): string | undefined {
  const code = useSearchParams()[0].get(CATEGORY_PARAM)
  return code && categories?.some((c) => c.code === code) ? code : undefined
}

/** 경로에 ?category= 를 붙인다. 없으면 그대로 */
export const withCategory = (path: string, category?: string) =>
  category ? `${path}?${CATEGORY_PARAM}=${encodeURIComponent(category)}` : path

/**
 * 분류가 있는 목록(게시판, 공지)의 탭: 전체 + 분류들. 분류가 없으면 그리지 않는다.
 * 탭은 ?category= 만 바꾼 링크(페이지는 1로)라 새 탭 열기·공유·뒤로가기가 그대로 된다.
 */
export function CategoryTabs({ categories }: { categories: readonly CategoryOption[] }) {
  const { pathname } = useLocation()
  const current = useCategoryParam(categories)
  if (categories.length === 0) return null

  const tabs = [{ code: undefined, label: '전체' }, ...categories]
  return (
    <nav
      aria-label="분류"
      className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
    >
      {tabs.map((t) => {
        const active = t.code === current
        return (
          <Link
            key={t.code ?? ''}
            to={withCategory(pathname, t.code)}
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
