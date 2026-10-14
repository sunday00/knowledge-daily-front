import { Link, useSearchParams } from 'react-router-dom'
import { useKakaoSignIn } from '@/actions/kakaoSignIn.ts'

export default function KakaoCallbackPage() {
  const [params] = useSearchParams()
  const { status } = useKakaoSignIn(params)

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Kakao Callback</h2>

      {status.kind === 'pending' && <p className="text-neutral-500">토큰 교환 중...</p>}

      {status.kind === 'error' && (
        <p className="text-red-600 dark:text-red-400">{status.message}</p>
      )}

      {status.kind === 'ok' && (
        <p className="text-green-600 dark:text-green-400">
          {status.isNewUser
            ? `환영합니다, ${status.nickname}님! 가입 완료되었습니다. `
            : `${status.nickname}님, 로그인 성공. `}
          잠시 후 홈으로 이동합니다.
        </p>
      )}

      <Link to="/" className="nav-link">
        홈으로
      </Link>
    </section>
  )
}
