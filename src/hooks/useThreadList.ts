import { useQuery } from '@apollo/client'
import { THREAD_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'

export const THREAD_PAGE_SIZE = 20

const variablesOf = (targetId: string) => ({
  input: {
    size: THREAD_PAGE_SIZE,
    search: { targetId: { eq: targetId } },
    // 오래된 대화부터
    sort: { _id: 1 },
  },
})

/** 대상(sense 등)의 대화록 목록. 커서 기반으로 이어 받는다. */
export function useThreadList(targetId: string | undefined) {
  const { data, loading, error, fetchMore, networkStatus } = useQuery(THREAD_STANDARD_LIST_QUERY, {
    variables: variablesOf(targetId ?? ''),
    skip: !targetId,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  })

  const res = data?.OpinionQuery.threadStandardList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const loadMore = () => {
    if (!targetId || !res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchMore({
      variables: { input: { ...variablesOf(targetId).input, after: res.nextCursor } },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.OpinionQuery.threadStandardList
        return {
          ...prev,
          OpinionQuery: {
            ...prev.OpinionQuery,
            threadStandardList: {
              ...next,
              items: [...prev.OpinionQuery.threadStandardList.items, ...next.items],
            },
          },
        }
      },
    })
  }

  return { res, loading: loading && !res, loadingMore, error, loadMore }
}
