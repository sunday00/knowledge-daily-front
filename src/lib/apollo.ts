import { ApolloClient, ApolloError, from, HttpLink, InMemoryCache } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { reportError } from './errorReporter'

const QUERY_NAMESPACES = [
  'AttachQryNamespace',
  'AuthQryNamespace',
  'NotifyQryNamespace',
  'OpinionQryNamespace',
  'ReactionQryNamespace',
  'SenseQryNamespace',
  'SystemQryNamespace',
  'TagQryNamespace',
  'UserQryNamespace',
  'VillainQryNamespace',
]

const uri = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

// 모든 API 에러를 화면 상단 ErrorBanner 로 보고.
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const error = new ApolloError({ graphQLErrors, networkError })
  reportError(`[API] ${operation.operationName}: ${error.message}`, error)
})

export const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    new HttpLink({
      uri,
      // HttpOnly 쿠키 전송을 위해 필수.
      // 서버 CORS 는 credentials:true + 명시된 origin 이어야 합니다.
      credentials: 'include',
    }),
  ]),
  cache: new InMemoryCache({
    // XxxQuery 네임스페이스는 id 없는 단일 객체라, 기본 동작이면 쿼리마다 통째로 덮어써서
    // 같은 네임스페이스의 다른 쿼리 결과(예: senseOne ↔ senseStandardList)가 사라진다. 합치도록 한다.
    typePolicies: Object.fromEntries(QUERY_NAMESPACES.map((t) => [t, { merge: true }])),
  }),
})
