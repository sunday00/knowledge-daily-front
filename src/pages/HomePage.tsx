import { useQuery } from '@apollo/client'
import { HEALTH_QUERY } from '../graphql/queries'

type HealthResult = { health: string }

export default function HomePage() {
  const { data, loading, error } = useQuery<HealthResult>(HEALTH_QUERY)

  return (
    <section>
      <h1>Knowledge Daily</h1>
      <p>React + React Router + Apollo GraphQL 세팅이 완료되었습니다.</p>

      <h2>GraphQL 연결 상태</h2>
      {loading && <p>로딩 중...</p>}
      {error && (
        <p style={{ color: 'tomato' }}>
          연결 실패: {error.message}
          <br />
          <small>
            VITE_GRAPHQL_ENDPOINT 환경변수 또는 기본값(localhost:4000/graphql)을 확인하세요.
          </small>
        </p>
      )}
      {data && <p>서버 응답: {data.health}</p>}
    </section>
  )
}
