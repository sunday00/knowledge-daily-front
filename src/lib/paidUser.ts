import { useAuth } from '@/auth/AuthProvider.tsx'

/**
 * 유료 회원인지.
 * TODO: 결제(유료 회원) 기능이 생기면 서버 값으로 바꾼다. 지금은 로그인한 사람을 모두 유료 회원으로 본다.
 */
export function useIsPaidUser(): boolean {
  const { user } = useAuth()
  return !!user
}
