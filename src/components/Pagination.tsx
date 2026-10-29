import { Link, useLocation, useSearchParams } from 'react-router-dom'

const PAGE_PARAM = 'page'
/** 한 번에 보여줄 페이지 번호 수 */
const WINDOW = 5

/** 주소의 ?page= (1부터). 없거나 잘못된 값이면 1 */
export function usePageParam(): number {
  const raw = Number(useSearchParams()[0].get(PAGE_PARAM))
  return Number.isInteger(raw) && raw > 1 ? raw : 1
}

const itemBase =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm tabular-nums no-underline transition-colors'
const itemIdle =
  'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
const itemCurrent = 'bg-brand-600 text-white font-medium'
const itemDisabled = 'text-neutral-300 dark:text-neutral-700 cursor-default'

/**
 * 페이지 이동 버튼: « 처음 ‹ 이전 [번호 5개] 다음 › 끝 ».
 * 각 버튼은 현재 주소에 ?page=N 만 바꾼 링크라 새 탭 열기·공유·뒤로가기가 그대로 된다.
 * (1페이지는 page 를 빼서 기본 주소와 같게 둔다)
 * 글이 없거나 한 페이지뿐이어도 최소 1페이지로 항상 보여준다.
 */
export function Pagination({ page, maxPage: rawMax }: { page: number; maxPage: number }) {
  const location = useLocation()
  const [params] = useSearchParams()
  const maxPage = Math.max(1, rawMax)

  const hrefOf = (n: number) => {
    const next = new URLSearchParams(params)
    if (n <= 1) next.delete(PAGE_PARAM)
    else next.set(PAGE_PARAM, String(n))
    const qs = next.toString()
    return `${location.pathname}${qs ? `?${qs}` : ''}`
  }

  // 현재 페이지가 가운데 오도록 번호 묶음을 잡는다 (양 끝에서는 밀어서 5개 유지)
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), maxPage - WINDOW + 1))
  const end = Math.min(maxPage, start + WINDOW - 1)
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const step = (n: number, label: string, text: string, enabled: boolean) =>
    enabled ? (
      <Link to={hrefOf(n)} aria-label={label} title={label} className={`${itemBase} ${itemIdle}`}>
        {text}
      </Link>
    ) : (
      <span aria-hidden className={`${itemBase} ${itemDisabled}`}>
        {text}
      </span>
    )

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1">
      {step(1, '처음 페이지', '«', page > 1)}
      {step(page - 1, '이전 페이지', '‹', page > 1)}
      {numbers.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${itemBase} ${itemCurrent}`}>
            {n}
          </span>
        ) : (
          <Link
            key={n}
            to={hrefOf(n)}
            aria-label={`${n} 페이지`}
            className={`${itemBase} ${itemIdle}`}
          >
            {n}
          </Link>
        ),
      )}
      {step(page + 1, '다음 페이지', '›', page < maxPage)}
      {step(maxPage, '마지막 페이지', '»', page < maxPage)}
    </nav>
  )
}
