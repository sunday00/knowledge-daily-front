import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { SYSTEM_HEALTH_QUERY } from '../graphql/queries/health'
import { SenseStandardList } from '../components/SenseStandardList'
import { ClockIcon } from '../components/ClockIcon'

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
    <section className="space-y-4 rounded-lg border-2 border-brand-500/40 dark:border-indigo-400/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <ClockIcon size={20} className="text-neutral-500 dark:text-neutral-400" />
          Recent Knowledge
        </h2>
        <Link
          to="/sense/my-sense"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-indigo-300 dark:hover:text-indigo-200 no-underline"
        >
          more →
        </Link>
      </div>
      <SenseStandardList size={5} />
    </section>
  )
}
