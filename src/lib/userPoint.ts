import { useSyncExternalStore } from 'react'

// 서버가 로그인 유저의 응답마다 실어 주는 포인트 헤더 (서버 CORS exposedHeaders 에 포함돼 있어야 읽힌다)
/** 현재 보유 포인트 (archive.point.cur) */
export const USER_POINT_HEADER = 'x-user-point'
/** 누적 획득 포인트 (archive.point.inc). 써도 줄지 않는다. earnPoints 업적 기준 */
export const USER_POINT_INC_HEADER = 'x-user-point-inc'

let point: number | null = null
let inc: number | null = null
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** 응답 헤더로 받은 보유 포인트로 바꾼다. 같은 값이면 알리지 않는다. null 은 지운다(로그아웃, 누적 획득도 같이). */
export function setUserPoint(next: number | null) {
  if (next === null && inc !== null) {
    inc = null
    point = null
    notify()
    return
  }
  if (next === point) return
  point = next
  notify()
}

/** 응답 헤더로 받은 누적 획득 포인트로 바꾼다. 같은 값이면 알리지 않는다. */
export function setUserPointInc(next: number | null) {
  if (next === inc) return
  inc = next
  notify()
}

const readNumber = (headers: Headers | undefined, name: string) => {
  const raw = headers?.get(name)
  if (raw == null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** 응답 헤더 값을 읽어 반영한다. 헤더가 없거나(비로그인) 숫자가 아니면 그대로 둔다. */
export function syncUserPointFromHeaders(headers: Headers | undefined) {
  const cur = readNumber(headers, USER_POINT_HEADER)
  if (cur !== null) setUserPoint(cur)
  const nextInc = readNumber(headers, USER_POINT_INC_HEADER)
  if (nextInc !== null) setUserPointInc(nextInc)
}

/** 현재 보유 포인트. 아직 받은 적 없으면 null */
export function useUserPoint(): number | null {
  return useSyncExternalStore(subscribe, () => point)
}

/** 누적 획득 포인트. 아직 받은 적 없으면 null */
export function useUserPointInc(): number | null {
  return useSyncExternalStore(subscribe, () => inc)
}

/** 내 포인트 내역 주소 (nav 포인트를 누르면 간다) */
export const POINT_HISTORY_PATH = '/user/point'
