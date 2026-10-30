import { useState } from 'react'

// 요청 기준 시각을 이 단위로 내려 맞춰, 화면을 다시 열어도 같은 캐시를 쓰게 한다.
const NOW_STEP_MS = 10 * 60 * 1000 // 10분

/**
 * startAt~endAt(노출·게시 기간) 검색 조건. 배너, 공지 공용.
 * 기준 시각을 내려 맞춘 만큼 넉넉히 받으므로, 정확한 기간은 isLive 로 다시 거른다.
 */
export function useLiveWindowSearch() {
  const [step] = useState(() => Math.floor(Date.now() / NOW_STEP_MS) * NOW_STEP_MS)
  return {
    startAt: { lte: new Date(step + NOW_STEP_MS).toISOString() },
    endAt: { gte: new Date(step).toISOString() },
  }
}

/** 지금 노출·게시 기간 안인지 */
export const isLive = (item: { startAt: unknown; endAt: unknown }, now = Date.now()) =>
  Date.parse(item.startAt as string) <= now && now <= Date.parse(item.endAt as string)
