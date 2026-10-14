import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

const uri = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
})
