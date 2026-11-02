// 홈 공지 롤링 목록을 노출 위치별로 5분간 보관한다. 게시 기간(startAt~endAt)은 꺼내 쓸 때 다시 확인한다.
const TTL_MS = 5 * 60 * 1000 // 5분
const KEY_PREFIX = 'knowledge-daily:noticeTicker:v1:'

export type TickerNotice = { _id: string; title: string; startAt: unknown; endAt: unknown }

type Cached = { items: TickerNotice[]; savedAt: number }

/** 5분 안에 저장한 목록. 없거나 지났거나 깨졌으면 null */
export function readTickerCache(spot: string): TickerNotice[] | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + spot)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (!Array.isArray(parsed.items) || Date.now() - parsed.savedAt > TTL_MS) return null
    return parsed.items
  } catch {
    return null
  }
}

export function writeTickerCache(spot: string, items: TickerNotice[]): void {
  try {
    const value: Cached = {
      // 저장에 필요한 값만 (Apollo 의 __typename 등은 뺀다)
      items: items.map(({ _id, title, startAt, endAt }) => ({ _id, title, startAt, endAt })),
      savedAt: Date.now(),
    }
    localStorage.setItem(KEY_PREFIX + spot, JSON.stringify(value))
  } catch {
    // 저장공간 초과 등은 조용히 무시 — 캐시가 안 될 뿐 기능엔 지장 없음
  }
}
