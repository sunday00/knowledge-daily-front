import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { CAMPAIGN_BANNER_LIST_QUERY } from '@/graphql/queries/campaign.ts'
import type { CampaignBannerListQuery } from '@/graphql/__generated__/graphql.ts'
import type { CarouselSlide } from '@/components/BannerCarousel.tsx'
import { campaignColor, campaignPath, findBannerAttach, isClosedCampaign } from '@/lib/campaign.ts'

type CampaignBanner =
  CampaignBannerListQuery['CampaignQuery']['campaignStandardList']['items'][number]

const CAMPAIGN_SIZE = 50

/** 캠페인을 캐러셀 한 장으로. 누르면 캠페인 상세로. 배너(flag) 첨부가 없으면 제목을 색 배경에 글자로 보인다. */
const campaignSlide = (c: CampaignBanner): CarouselSlide => ({
  key: `campaign:${c._id}`,
  title: c.title,
  subTitle: c.subTitle,
  showTitle: false,
  href: campaignPath(c),
  attach: findBannerAttach(c.attaches)?.attach,
  background: campaignColor(c._id),
  sortKey: c.sortKey,
})

/**
 * 노출 위치가 prefix(예: 'HOME_')로 시작하는 캠페인을 받아 위치별(exposedOn) 캐러셀 장으로 나눠 준다.
 * 서버가 시작 전은 빼 주고, 끝났거나 닫힌(CLOSE) 캠페인은 여기서 뺀다. 각 위치 안에서는 sortKey 순.
 */
export function useCampaignBanners(prefix: string) {
  const { data, loading } = useQuery(CAMPAIGN_BANNER_LIST_QUERY, {
    variables: {
      input: {
        size: CAMPAIGN_SIZE,
        sort: { sortKey: 1 },
        search: { exposedOn: { contains: prefix } },
      },
    },
    fetchPolicy: 'cache-first',
  })
  const res = data?.CampaignQuery.campaignStandardList

  const bySpot = useMemo(() => {
    const bySpot = new Map<string, CarouselSlide[]>()
    if (!res?.success) return bySpot
    const now = Date.now()
    for (const c of res.items) {
      if (isClosedCampaign(c, now)) continue
      for (const spot of c.exposedOn) {
        if (!spot.startsWith(prefix)) continue
        bySpot.set(spot, [...(bySpot.get(spot) ?? []), campaignSlide(c)])
      }
    }
    return bySpot
  }, [res, prefix])

  return { bySpot, loading: loading && !res }
}
