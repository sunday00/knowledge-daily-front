const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'
const STATE_STORAGE_KEY = 'kakao_oauth_state'

function readConfig() {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new Error(
      'Kakao env missing. VITE_KAKAO_REST_API_KEY / VITE_KAKAO_REDIRECT_URI 를 .env.local 에 설정하세요.',
    )
  }
  return { clientId, redirectUri }
}

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildKakaoAuthorizeUrl(): string {
  const { clientId, redirectUri } = readConfig()
  const state = randomState()
  sessionStorage.setItem(STATE_STORAGE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    // scope: 'profile_nickname,account_email', // 필요 시 활성화
  })
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`
}

export function consumeKakaoState(): string | null {
  const stored = sessionStorage.getItem(STATE_STORAGE_KEY)
  sessionStorage.removeItem(STATE_STORAGE_KEY)
  return stored
}
