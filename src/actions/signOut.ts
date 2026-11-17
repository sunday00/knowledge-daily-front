import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { AUTH_LOGOUT_MUTATION } from '@/graphql/mutations/auth.ts'

/**
 * 로그아웃. 서버에 알려 인증 쿠키(HttpOnly)를 만료시키고, 로컬 세션을 비운 뒤 홈으로.
 * 서버 응답은 기다리지 않는다 (실패해도 로컬은 비운다. 남은 쿠키는 로그아웃 상태 요청에 실리지 않는다)
 */
export function useSignOut() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [logout] = useMutation(AUTH_LOGOUT_MUTATION)
  return () => {
    void logout().catch(() => {})
    signOut()
    navigate('/', { replace: true })
  }
}
