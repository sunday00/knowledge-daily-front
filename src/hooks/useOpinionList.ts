import { useQuery } from '@apollo/client'
import { OPINION_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'

export const OPINION_PAGE_SIZE = 20

const variablesOf = (threadId: string) => ({
  input: {
    size: OPINION_PAGE_SIZE,
    search: { parent: { eq: threadId }, complex: { id: ['parent'] } },
    // 오래된 의견부터 (대화 순서)
    sort: { _id: 1 },
  },
})

/** 한 대화(thread)에 달린 의견 목록. 커서 기반으로 이어 받는다. */
export function useOpinionList(threadId: string) {
  const { data, loading, error, fetchMore, networkStatus } = useQuery(OPINION_STANDARD_LIST_QUERY, {
    variables: variablesOf(threadId),
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  })

  const res = data?.OpinionQuery.opinionStandardList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchMore({
      variables: { input: { ...variablesOf(threadId).input, after: res.nextCursor } },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.OpinionQuery.opinionStandardList
        return {
          ...prev,
          OpinionQuery: {
            ...prev.OpinionQuery,
            opinionStandardList: {
              ...next,
              items: [...prev.OpinionQuery.opinionStandardList.items, ...next.items],
            },
          },
        }
      },
    })
  }

  return { res, loading: loading && !res, loadingMore, error, loadMore }
}
