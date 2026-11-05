import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { POINT_HISTORY_PATH, useUserPoint } from '@/lib/userPoint.ts'

/** 내 현재 포인트. 로그인 상태에서 응답 헤더로 한 번이라도 받았을 때만 보인다. 누르면 포인트 내역 */
export function UserPoint() {
  const { user } = useAuth()
  const point = useUserPoint()
  if (!user || point === null) return null

  return (
    <Link
      to={POINT_HISTORY_PATH}
      title={`포인트 ${point.toLocaleString()} · 내역 보기`}
      className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-amber-800 no-underline transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
    >
      <span className="sr-only">포인트 </span>
      {point.toLocaleString()}P
    </Link>
  )
}
