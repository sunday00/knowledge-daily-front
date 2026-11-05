import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BackIcon } from '@/components/BackIcon.tsx'

/**
 * 상세 화면에서 목록으로 돌아가는 버튼. 모든 상세 화면이 같은 모양을 쓴다.
 * 목록에서 state.from(보던 목록 주소, ?page= 포함)을 넘겨받았으면 그리로, 아니면 fallback 으로 간다.
 */
export function BackToList({ fallback, children }: { fallback: string; children: ReactNode }) {
  const from = (useLocation().state as { from?: string } | null)?.from
  return <BackToLink to={from ?? fallback}>{children}</BackToLink>
}

/** BackToList 의 모양만. 주소와 state 를 직접 줄 때 (대화 → 대화록 전체 등) */
export function BackToLink({
  to,
  state,
  children,
}: {
  to: string
  state?: unknown
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      state={state}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 text-sm text-neutral-600 dark:text-neutral-300 no-underline transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-indigo-300"
    >
      <BackIcon />
      {children}
    </Link>
  )
}
