import type { SenseMyListQuery } from '@/graphql/__generated__/graphql.ts'

// 내 Knowledge 기본 목록(검색어 없음)의 1~5 페이지를 사용자별로 10분간 보관한다.
export const MY_LIST_PAGE_SIZE = 20
const MAX_CACHED_PAGES = 5
const TTL_MS = 10 * 60 * 1000 // 10분

type Cached = {
  data: SenseMyListQuery
  /** 1페이지를 서버에서 받은 시각. 이후 페이지를 이어 받아도 갱신하지 않는다. */
  savedAt: number
}

const KEY_PREFIX = 'knowledge-daily:senseMyList:v1:'
const storageKey = (userId: string) => `${KEY_PREFIX}user=${userId}`

function read(userId: string): Cached | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (Date.now() - parsed.savedAt > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function readMyListCache(userId: string): SenseMyListQuery | null {
  return read(userId)?.data ?? null
}

/**
 * 5페이지 이내로 불러온 상태만 저장한다. (그 이상은 기존 5페이지 스냅샷 유지)
 * 유효한 저장본이 있으면 그 savedAt 을 유지해, 다음 페이지를 이어 받아도 만료가 늘어나지 않게 한다.
 */
export function writeMyListCache(userId: string, data: SenseMyListQuery): void {
  const count = data.SenseQuery.senseMyList.items.length
  if (count > MAX_CACHED_PAGES * MY_LIST_PAGE_SIZE) return

  const savedAt = read(userId)?.savedAt ?? Date.now()
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ data, savedAt } satisfies Cached))
  } catch {
    // 저장공간 초과 등은 조용히 무시 — 캐시가 안 될 뿐 기능엔 지장 없음
  }
}

/** 관심 설정 변경 등으로 목록이 달라질 때 모든 사용자의 캐시를 지운다. */
export function clearMyListCache(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
