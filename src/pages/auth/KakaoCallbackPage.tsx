import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { consumeKakaoState } from '../../lib/kakao'
import { setAccessToken } from '../../lib/authStorage'
import { KAKAO_LOGIN_MUTATION } from '../../graphql/mutations/auth'

type Status =
  | { kind: 'pending' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ok'
      payload: {
        accessToken: string
        expiresIn: number
        isNewUser: boolean
        user: string
      }
    }

export default function KakaoCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>({ kind: 'pending' })
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
          setStatus({
            kind: 'error',
            message: res?.message ?? '서버가 실패를 반환했습니다.',
          })
          return
        }

        setAccessToken(res.item.accessToken)
        setStatus({ kind: 'ok', payload: res.item })

        setTimeout(() => navigate('/', { replace: true }), 800)
      })
      .catch((e: unknown) => {
        setStatus({
          kind: 'error',
          message: e instanceof Error ? e.message : String(e),
        })
      })
  }, [params, kakaoLogin, navigate])

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Kakao Callback</h1>

      {status.kind === 'pending' && <p className="text-neutral-500">토큰 교환 중...</p>}

      {status.kind === 'error' && (
        <p className="text-red-600 dark:text-red-400">{status.message}</p>
      )}

      {status.kind === 'ok' && (
        <>
          <p className="text-green-600 dark:text-green-400">
            {status.payload.isNewUser ? '환영합니다! 가입 완료되었습니다.' : '로그인 성공.'} 잠시 후
            홈으로 이동합니다.
          </p>
          <pre className="rounded-md bg-neutral-100 dark:bg-neutral-900 p-4 text-sm overflow-x-auto">
            {JSON.stringify(status.payload, null, 2)}
          </pre>
        </>
      )}

      <Link to="/" className="nav-link">
        홈으로
      </Link>
    </section>
  )
}
