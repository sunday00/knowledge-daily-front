import { useEffect } from 'react'
import { useApolloClient } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { AUTH_ME_QUERY } from '@/graphql/queries/auth.ts'

/**
 * 약관 동의 확인. 서버는 AuthQuery.me 에서만 동의하지 않은(또는 개정된) 문서를 DOCUMENTS_UNAGREED 로 알려 준다.
 * 로그인 상태로 앱을 열 때 / 로그인할 때마다 한 번 묻고, 에러가 오면 apollo errorLink 가 동의 받기로 돌린다.
 */
export function useAgreementCheck() {
  const { user, signedInAt } = useAuth()
  const userId = user?.userId
  const client = useApolloClient()

  useEffect(() => {
    if (!userId) return
    void client
      .query({
        query: AUTH_ME_QUERY,
        fetchPolicy: 'network-only',
        // 세션 만료 등은 여기서 알리지 않는다 (동의 필요는 errorLink 가 처리)
        context: { expectedErrorCodes: ['UNAUTHORIZED'] },
      })
      .catch(() => {})
  }, [userId, signedInAt, client])
}
