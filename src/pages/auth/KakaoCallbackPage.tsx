import { Link, useSearchParams } from 'react-router-dom'
import { useKakaoSignIn } from '@/actions/kakaoSignIn.ts'
import { formatDateTime } from '@/lib/formatDate.ts'

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

      {status.kind === 'rejoinRestricted' && (
        // 일반 로그인 실패와 구분: 탈퇴 후 재가입 제한 기간
        <p
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          탈퇴 후 재가입 제한 기간입니다.{' '}
          {status.rejoinAt
            ? `${formatDateTime(status.rejoinAt)} 이후에 다시 가입할 수 있어요.`
            : '잠시 후 다시 가입할 수 있어요.'}
        </p>
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
