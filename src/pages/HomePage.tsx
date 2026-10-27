import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { SYSTEM_HEALTH_QUERY } from '../graphql/queries/health'
import { SenseStandardList } from '../components/SenseStandardList'
import { SenseBuzzList, SensePopularList } from '../components/SenseTopList'
import { ClockIcon } from '../components/ClockIcon'
import { FlameIcon } from '../components/FlameIcon'
import { ChatIcon } from '../components/ChatIcon'

export default function HomePage() {
  const { data } = useQuery(SYSTEM_HEALTH_QUERY, {
    variables: { input: { d: 1 } },
  })

  useEffect(() => {
    if (data?.SystemQuery.health.success) {
      console.log('healthy!')
    }
  }, [data])

  return (
    <div className="space-y-6">
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
