import { useSyncExternalStore } from 'react'

// 서버가 로그인 유저의 응답마다 실어 주는 현재 포인트 헤더 (서버 CORS exposedHeaders 에 포함돼 있어야 읽힌다)
export const USER_POINT_HEADER = 'x-user-point'

let point: number | null = null
const listeners = new Set<() => void>()

/** 응답 헤더로 받은 포인트로 바꾼다. 같은 값이면 알리지 않는다. null 은 지운다(로그아웃). */
export function setUserPoint(next: number | null) {
  if (next === point) return
  point = next
  listeners.forEach((l) => l())
}

/** 응답 헤더 값을 읽어 반영한다. 헤더가 없거나(비로그인) 숫자가 아니면 그대로 둔다. */
export function syncUserPointFromHeaders(headers: Headers | undefined) {
  const raw = headers?.get(USER_POINT_HEADER)
  if (raw == null || raw.trim() === '') return
  const n = Number(raw)
  if (Number.isFinite(n)) setUserPoint(n)
}

/** 현재 포인트. 아직 받은 적 없으면 null */
export function useUserPoint(): number | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => point,
  )
}

/** 내 포인트 내역 주소 (nav 포인트를 누르면 간다) */
export const POINT_HISTORY_PATH = '/user/point'
