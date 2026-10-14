import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { SYSTEM_HEALTH_QUERY } from '../graphql/queries/health'

export default function HomePage() {
  const { data, loading, error } = useQuery(SYSTEM_HEALTH_QUERY, {
    variables: { input: { d: 1 } },
  })

  useEffect(() => {
    if (data?.SystemQuery.health.success) {
      console.log('healthy!')
    }
  }, [data])

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Knowledge Daily</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        React + React Router + Apollo GraphQL + UnoCSS 세팅이 완료되었습니다.
      </p>

      <h2 className="text-xl font-semibold mt-6">Health check</h2>
      {loading && <p className="text-neutral-500">확인 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">에러: {error.message}</p>}
      {data && (
        <pre className="rounded-md bg-neutral-100 dark:bg-neutral-900 p-4 text-sm overflow-x-auto">
          {JSON.stringify(data.SystemQuery.health, null, 2)}
        </pre>
      )}
    </section>
  )
}
