import { useState } from 'react'
import { ApolloError, useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { USER_RESIGN_MUTATION } from '@/graphql/mutations/user.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { RESIGNED_PARAM } from '@/lib/resign.ts'

/** 회원 탈퇴. 성공하면 로그아웃과 같이 로컬 세션을 비우고 홈으로 보내 '탈퇴되었습니다' 를 띄운다. */
export function useResign() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading }] = useMutation(USER_RESIGN_MUTATION, {
    // 결과는 모달에 직접 보여 주므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: ['UNAUTHORIZED'] },
  })

  /** reason 은 선택. 없으면 input 없이 보낸다 */
  const resign = async (reason?: string | null) => {
    setError(null)
    try {
      const { data } = await mutate({ variables: { input: reason ? { reason } : null } })
      const res = data?.UserMutation.userResign
      // item false = 이미 탈퇴한 상태. 어느 쪽이든 이 기기에선 로그아웃시킨다.
      if (!res?.success) {
        setError(res?.message ?? '탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      signOut()
      navigate(`/?${RESIGNED_PARAM}=1`, { replace: true })
    } catch (e: unknown) {
      const code =
        e instanceof ApolloError
          ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
          : undefined
      setError(
        code === 'UNAUTHORIZED'
          ? '로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.'
          : '탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  return { resign, loading, error }
}
