import { useSyncExternalStore } from 'react'

// 이번 세션(새로고침 전)에 내가 단 의견 _id. Apollo 메모리 캐시와 수명이 같다.
// 페이지를 오가도 유지되어, 임시 카드든 무한스크롤로 제자리에 다시 온 카드든 같이 강조한다.
let added: ReadonlySet<string> = new Set()
const listeners = new Set<() => void>()

export function markOpinionAdded(opinionId: string): void {
  added = new Set(added).add(opinionId)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAddedOpinionIds = () => useSyncExternalStore(subscribe, () => added)
