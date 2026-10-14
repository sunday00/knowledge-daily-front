import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

const uri = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri,
    // HttpOnly 쿠키 전송을 위해 필수.
    // 서버 CORS 는 credentials:true + 명시된 origin 이어야 합니다.
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
})