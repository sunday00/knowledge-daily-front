import { ApolloClient, ApolloError, from, HttpLink, InMemoryCache } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { reportError } from './errorReporter'

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
  cache: new InMemoryCache(),
})
