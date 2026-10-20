import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApolloError, useMutation } from '@apollo/client'
import { KAKAO_LOGIN_MUTATION } from '@/graphql/mutations/auth.ts'
import { consumeKakaoState } from '@/lib/kakao.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { reportError } from '@/lib/errorReporter.ts'

export type KakaoSignInStatus =
  | { kind: 'pending' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; isNewUser: boolean; nickname: string }

export function useKakaoSignIn(params: URLSearchParams) {
  const [status, setStatus] = useState<KakaoSignInStatus>({ kind: 'pending' })
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [kakaoLogin] = useMutation(KAKAO_LOGIN_MUTATION)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    // 실패 시 상단 ErrorBanner 로 상세 로그를 띄운다.
    // API 에러(ApolloError)는 apollo errorLink 에서 이미 보고되므로 중복 보고하지 않는다.
    const fail = (message: string, detail?: unknown) => {
      if (!(detail instanceof ApolloError)) reportError(`[로그인 실패] ${message}`, detail)
      setStatus({ kind: 'error', message })
    }

    const code = params.get('code')
    const state = params.get('state')
    const err = params.get('error')
    const errDesc = params.get('error_description')

    if (err) {
      fail(`${err}: ${errDesc ?? ''}`)
      return
    }

    const expectedState = consumeKakaoState()
    if (!state || !expectedState || state !== expectedState) {
      fail('state 불일치 — CSRF 위험으로 중단합니다.', { state, expectedState })
      return
    }

    if (!code) {
      fail('code 파라미터가 없습니다.')
      return
    }

    kakaoLogin({ variables: { input: { code } } })
      .then(({ data, errors }) => {
        if (errors?.length) {
          fail(errors.map((e) => e.message).join(', '), errors)
          return
        }
        const res = data?.AuthMutation.authKakaoLogin
        if (!res || !res.success) {
          fail(res?.message ?? '서버가 실패를 반환했습니다.', res)
          return
        }

        signIn({ userId: res.item.userId, nickname: res.item.nickname })
        setStatus({
          kind: 'ok',
          isNewUser: res.item.isNewUser,
          nickname: res.item.nickname,
        })

        setTimeout(() => navigate('/', { replace: true }), 600)
      })
      .catch((e: unknown) => {
        fail(e instanceof Error ? e.message : String(e), e)
      })
  }, [params, kakaoLogin, navigate, signIn])

  return { status }
}
