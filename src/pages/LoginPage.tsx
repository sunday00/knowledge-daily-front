import { useState } from 'react'
import { buildKakaoAuthorizeUrl } from '../lib/kakao'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  const handleKakaoLogin = () => {
    try {
      window.location.href = buildKakaoAuthorizeUrl()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">로그인</h2>
      <p className="text-neutral-600 dark:text-neutral-400">소셜 로그인으로 시작하세요.</p>

      <button
        type="button"
        onClick={handleKakaoLogin}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FEE500] text-[#191600] font-semibold hover:brightness-95 transition"
      >
        <span aria-hidden>💬</span>
        카카오로 시작하기
      </button>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">설정 오류: {error}</p>}
    </section>
  )
}
