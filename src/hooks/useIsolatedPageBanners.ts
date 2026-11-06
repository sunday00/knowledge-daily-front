import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { ISOLATED_PAGE_BANNER_LIST_QUERY } from '@/graphql/queries/isolatedPage.ts'
import type { CarouselSlide } from '@/components/BannerCarousel.tsx'
import { campaignColor, findBannerAttach } from '@/lib/campaign.ts'
import { isolatedPagePath } from '@/lib/isolatedPage.ts'

const PAGE_SIZE = 50

/**
 * 노출 위치(spot, 예: HOME_TOP_MID)에 걸린 독립 페이지를 캐러셀 장으로.
 * 정렬값은 배너 첨부(flag banner)의 sortKey 로 해서 다른 배너·캠페인과 섞는다. 배너가 없으면 페이지 sortKey.
 * 배너가 없으면 제목을 색 배경에 글자로 보인다. 누르면 그 페이지로.
 */
export function useIsolatedPageBanners(spot: string) {
  const { data, loading } = useQuery(ISOLATED_PAGE_BANNER_LIST_QUERY, {
    variables: {
      input: { size: PAGE_SIZE, sort: { sortKey: 1 }, search: { exposedOn: { eq: spot } } },
    },
    fetchPolicy: 'cache-first',
  })
  const res = data?.IsolatedPageQuery.isolatedPageStandardList

  const slides = useMemo<CarouselSlide[]>(() => {
    if (!res?.success) return []
    return res.items.map((p) => {
      const banner = findBannerAttach(p.attaches)
      return {
        key: `page:${p._id}`,
        title: p.title,
        subTitle: p.subTitle,
        showTitle: false,
        href: isolatedPagePath(p),
        attach: banner?.attach,
        background: campaignColor(p._id),
        sortKey: banner?.sortKey ?? p.sortKey,
      }
    })
  }, [res])

  return { slides, loading: loading && !res }
}
