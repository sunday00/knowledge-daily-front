import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { KAKAO_LOGIN_MUTATION } from '@/graphql/mutations/auth.ts'
import { consumeKakaoState } from '@/lib/kakao.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'

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

    const code = params.get('code')
    const state = params.get('state')
    const err = params.get('error')
    const errDesc = params.get('error_description')

    if (err) {
      setStatus({ kind: 'error', message: `${err}: ${errDesc ?? ''}` })
      return
    }

    const expectedState = consumeKakaoState()
    if (!state || !expectedState || state !== expectedState) {
      setStatus({ kind: 'error', message: 'state 불일치 — CSRF 위험으로 중단합니다.' })
      return
    }

    if (!code) {
      setStatus({ kind: 'error', message: 'code 파라미터가 없습니다.' })
      return
    }

    kakaoLogin({ variables: { input: { code } } })
      .then(({ data, errors }) => {
        if (errors?.length) {
          setStatus({ kind: 'error', message: errors.map((e) => e.message).join(', ') })
          return
        }
        const res = data?.AuthMutation.authKakaoLogin
        if (!res || !res.success) {
          setStatus({ kind: 'error', message: res?.message ?? '서버가 실패를 반환했습니다.' })
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
        setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
      })
  }, [params, kakaoLogin, navigate, signIn])

  return { status }
}
