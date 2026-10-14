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
    <section>
      <h1>Knowledge Daily</h1>
      <p>React + React Router + Apollo GraphQL 세팅이 완료되었습니다.</p>

      <h2>Health check</h2>
      {loading && <p>확인 중...</p>}
      {error && <p style={{ color: 'tomato' }}>에러: {error.message}</p>}
      {data && <pre>{JSON.stringify(data.SystemQuery.health, null, 2)}</pre>}
    </section>
  )
}
