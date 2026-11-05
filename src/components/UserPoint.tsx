import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { POINT_HISTORY_PATH, useUserPoint } from '@/lib/userPoint.ts'
import { AUTH_ME_QUERY } from '@/graphql/queries/auth.ts'

/** 내 현재 포인트. 로그인 상태에서 응답 헤더로 한 번이라도 받았을 때만 보인다. 누르면 포인트 내역 */
export function UserPoint() {
  const { user } = useAuth()
  const point = useUserPoint()
  // 포인트는 로그인 요청의 응답 헤더로만 온다. 처음 연 화면이 서버에 묻는 게 없으면(예: 프로모션)
  // 새로고침 뒤 비어 있으므로, 아직 못 받았으면 가벼운 me 조회로 한 번 받아 온다.
  useQuery(AUTH_ME_QUERY, {
    skip: !user || point !== null,
    fetchPolicy: 'network-only',
    // 세션 만료 등은 여기서 알리지 않는다
    context: { expectedErrorCodes: ['UNAUTHORIZED'] },
  })
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
