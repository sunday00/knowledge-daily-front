import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { BANNER_LIST_QUERY } from '@/graphql/queries/banner.ts'
import type { BannerListQuery } from '@/graphql/__generated__/graphql.ts'

export type Banner = BannerListQuery['BannerQuery']['bannerStandardList']['items'][number]

/** 노출 위치 (admin front - admin api - user front 간 약속값) */
export const BANNER_SPOT = {
  HOME_TOP_MID: 'HOME_TOP_MID',
  HOME_BOTTOM_MID: 'HOME_BOTTOM_MID',
} as const

const BANNER_SIZE = 50
// 요청 기준 시각을 이 단위로 내려 맞춰, 화면을 다시 열어도 같은 캐시를 쓰게 한다.
const NOW_STEP_MS = 10 * 60 * 1000 // 10분

const isLive = (b: Banner, now: number) =>
  Date.parse(b.startAt as string) <= now && now <= Date.parse(b.endAt as string)

/**
 * 노출 위치가 prefix(예: 'HOME_')로 시작하고 지금 노출 기간인 배너를 한 번에 받아
 * 위치별(exposedOn)로 나눠 준다. 각 위치 안에서는 sortKey 순.
 */
export function useBanners(prefix: string) {
  const [nowStep] = useState(() => Math.floor(Date.now() / NOW_STEP_MS) * NOW_STEP_MS)
  const { data } = useQuery(BANNER_LIST_QUERY, {
    variables: {
      input: {
        size: BANNER_SIZE,
        sort: { sortKey: 1 },
        search: {
          exposedOn: { contains: prefix },
          status: { eq: 'ACTIVE' },
          // 기준 시각을 내려 맞춘 만큼 넉넉히 받고, 정확한 기간은 아래에서 다시 거른다.
          startAt: { lte: new Date(nowStep + NOW_STEP_MS).toISOString() },
          endAt: { gte: new Date(nowStep).toISOString() },
        },
      },
    },
    fetchPolicy: 'cache-first',
  })
  const res = data?.BannerQuery.bannerStandardList

  return useMemo(() => {
    const bySpot = new Map<string, Banner[]>()
    if (!res?.success) return bySpot
    const now = Date.now()
    for (const b of res.items) {
      if (!isLive(b, now)) continue
      for (const spot of b.exposedOn) {
        if (!spot.startsWith(prefix)) continue
        bySpot.set(spot, [...(bySpot.get(spot) ?? []), b])
      }
    }
    return bySpot
  }, [res, prefix])
}
