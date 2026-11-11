import {
  ApolloClient,
  ApolloError,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  Observable,
} from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { reportError } from './errorReporter'
import {
  ensureSharedConfigs,
  isNotMatchedConfig,
  isServiceUpdating,
  refreshSharedConfigs,
  SHARED_CONFIGS_VERSION_HEADER,
} from './sharedConfigs'
import { syncUserPointFromHeaders } from './userPoint'

const QUERY_NAMESPACES = [
  'AttachQryNamespace',
  'AuthQryNamespace',
  'CampaignQryNamespace',
  'DocumentQryNamespace',
  'EmbedQryNamespace',
  'IsolatedPageQryNamespace',
  'NotifyQryNamespace',
  'OpinionQryNamespace',
  'PointQryNamespace',
  'QuizQryNamespace',
  'ReactionQryNamespace',
  'SenseQryNamespace',
  'SystemQryNamespace',
  'TagQryNamespace',
  'UserQryNamespace',
  'VillainQryNamespace',
]

const uri = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

// 모든 API 에러를 화면 상단 ErrorBanner 로 보고.
// 화면에서 직접 처리하는 에러(예: 아직 신청 안 함)는 요청 context 의 expectedErrorCodes 에 적으면 보고하지 않는다.
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const expected = (operation.getContext().expectedErrorCodes ?? []) as string[]
  if (
    !networkError &&
    graphQLErrors?.length &&
    graphQLErrors.every((g) => expected.includes(String(g.extensions?.code)))
  ) {
    return
  }
  const error = new ApolloError({ graphQLErrors, networkError })
  reportError(`[API] ${operation.operationName}: ${error.message}`, error)
})

// 모든 요청에 로컬 공용 설정의 version 을 헤더로 싣는다. 로컬에 없으면 먼저 받아 저장한다.
const sharedConfigsLink = setContext(async (_, { headers }) => {
  const version = (await ensureSharedConfigs())?.version
  return version ? { headers: { ...headers, [SHARED_CONFIGS_VERSION_HEADER]: version } } : {}
})

// 서버가 NOT_MATCHED_CONFIG 를 주면 공용 설정을 다시 받아 로컬에 덮어쓰고, 같은 요청을 한 번만 다시 보낸다.
// 다시 보낼 때 sharedConfigsLink 를 다시 지나므로 새 version 헤더가 실린다.
const configVersionRetryLink = new ApolloLink(
  (operation, forward) =>
    new Observable((observer) => {
      let closed = false
      let sub: { unsubscribe: () => void } | null = null

      const run = (canRetry: boolean) => {
        let retrying = false
        sub = forward(operation).subscribe({
          next: (result) => {
            if (canRetry && isNotMatchedConfig(result.errors)) {
              retrying = true
              void refreshSharedConfigs().then(() => {
                if (closed) return
                // 메이저 업데이트로 페이지를 새로 여는 중이면 다시 보내지 않고 끝낸다.
                if (isServiceUpdating()) observer.complete()
                else run(false)
              })
              return
            }
            observer.next(result)
          },
          error: (e) => observer.error(e),
          complete: () => {
            if (!retrying) observer.complete()
          },
        })
      }

      run(true)
      return () => {
        closed = true
        sub?.unsubscribe()
      }
    }),
)

// 응답 헤더의 현재 포인트(x-user-point)를 받을 때마다 반영한다.
const userPointLink = new ApolloLink((operation, forward) =>
  forward(operation).map((result) => {
    const { response } = operation.getContext() as { response?: Response }
    syncUserPointFromHeaders(response?.headers)
    return result
  }),
)

export const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    configVersionRetryLink,
    sharedConfigsLink,
    userPointLink,
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
