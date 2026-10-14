// 인증 자체는 서버가 HttpOnly 쿠키로 관리합니다.
// 여기서는 UI 표시용 userId / nickname 만 로컬에 보관합니다 (보안 목적 아님).
const USER_ID_KEY = 'auth_user_id'
const NICKNAME_KEY = 'auth_nickname'

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getNickname(): string | null {
  return localStorage.getItem(NICKNAME_KEY)
}

export function saveSession({
  userId,
  nickname,
}: {
  userId: string
  nickname: string
}): void {
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(NICKNAME_KEY, nickname)
}

export function updateNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname)
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(NICKNAME_KEY)
}