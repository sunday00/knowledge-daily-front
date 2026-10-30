import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { SYSTEM_HEALTH_QUERY } from '../graphql/queries/health'
import { SenseStandardList } from '../components/SenseStandardList'
import { SenseBuzzList, SensePopularList } from '../components/SenseTopList'
import { ArticleBuzzList, ArticlePopularList } from '../components/ArticleTopList'
import { ClockIcon } from '../components/ClockIcon'
import { FlameIcon } from '../components/FlameIcon'
import { ChatIcon } from '../components/ChatIcon'
import { BannerCarousel } from '../components/BannerCarousel'
import { BANNER_SPOT, useBanners } from '../hooks/useBanners'
import { LoadingSpinner } from '../components/LoadingSpinner'

export default function HomePage() {
  const { data } = useQuery(SYSTEM_HEALTH_QUERY, {
    variables: { input: { d: 1 } },
  })

  useEffect(() => {
    if (data?.SystemQuery.health.success) {
      console.log('healthy!')
    }
  }, [data])

  const { bySpot: banners, loading: bannersLoading } = useBanners('HOME_')
  const topBanners = banners.get(BANNER_SPOT.HOME_TOP_MID) ?? []
  const bottomBanners = banners.get(BANNER_SPOT.HOME_BOTTOM_MID) ?? []
  // 배너는 있는지 받아 봐야 알므로, 받는 동안만 자리에 스피너를 둔다.
  const bannerSpinner = bannersLoading && <LoadingSpinner size="sm" label="배너 불러오는 중..." />

  return (
    <div className="space-y-6">
      {bannerSpinner || <BannerCarousel banners={topBanners} label="상단 배너" />}
      <HomeSection
        icon={<ClockIcon size={20} className="text-neutral-500 dark:text-neutral-400" />}
        title="Recent Knowledge"
      >
        <SenseStandardList size={3} />
      </HomeSection>
      <HomeSection
        icon={<FlameIcon size={20} className="text-orange-500 dark:text-orange-400" />}
        title="인기 상식 Top 3"
      >
        <SensePopularList size={3} />
      </HomeSection>
      <HomeSection
        icon={<ChatIcon size={20} className="text-brand-500 dark:text-indigo-300" />}
        title="와글와글 Top 3"
      >
        <SenseBuzzList size={3} />
      </HomeSection>
      <HomeSection
        icon={<FlameIcon size={20} className="text-orange-500 dark:text-orange-400" />}
        title="인기 게시글 Top 3"
      >
        <ArticlePopularList size={3} />
      </HomeSection>
      <HomeSection
        icon={<ChatIcon size={20} className="text-brand-500 dark:text-indigo-300" />}
        title="댓글 많은 게시글 Top 3"
      >
        <ArticleBuzzList size={3} />
      </HomeSection>
      {bannerSpinner || <BannerCarousel banners={bottomBanners} label="하단 배너" />}
    </div>
  )
}

function HomeSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-lg border-2 border-brand-500/40 dark:border-indigo-400/40 p-5">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}
