import { useSyncExternalStore } from 'react'

// @sid 로 찾았지만 없던(삭제되었거나 존재하지 않는) 의견의 sid.
// 새로고침 전까지 기억해, 같은 링크를 다시 눌러도 페이지를 처음부터 다시 받지 않고 바로 안내한다.
// 본문의 @sid 링크도 이걸 보고 비활성으로 바뀐다.
let missing: ReadonlySet<number> = new Set()
const listeners = new Set<() => void>()

export const isMissingSid = (sid: number) => missing.has(sid)

export const markMissingSid = (sid: number) => {
  if (missing.has(sid)) return
  missing = new Set(missing).add(sid)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useMissingSids = () => useSyncExternalStore(subscribe, () => missing)
