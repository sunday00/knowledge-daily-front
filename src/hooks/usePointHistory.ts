import { useQuery } from '@apollo/client'
import { POINT_HISTORY_MY_LIST_QUERY } from '@/graphql/queries/point.ts'
import type { PointHistoryListMyQry } from '@/graphql/__generated__/graphql.ts'
import { useOncePerCursor } from '@/hooks/usePendingCards.ts'

export const POINT_HISTORY_PAGE_SIZE = 20

/** 전체 / 획득(+) / 지출(-) */
export type PointHistoryFilter = 'all' | 'earn' | 'spend'

const inputOf = (filter: PointHistoryFilter, after?: string): PointHistoryListMyQry => ({
  size: POINT_HISTORY_PAGE_SIZE,
  // 최신순. _id 는 만든 순서라 커서로 이어 받기에 맞다.
  sort: { _id: -1 },
  ...(filter === 'earn' && { search: { delta: { gt: 0 } } }),
  ...(filter === 'spend' && { search: { delta: { lt: 0 } } }),
  ...(after && { after }),
})

/** 내 포인트 내역. 커서 기반으로 이어 받는다. */
export function usePointHistory(filter: PointHistoryFilter) {
  const { data, loading, error, fetchMore, networkStatus } = useQuery(POINT_HISTORY_MY_LIST_QUERY, {
    variables: { input: inputOf(filter) },
    // 들어올 때마다 최신 내역을 받는다. (적립은 나중에 처리돼 바뀌기 쉽다)
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  })
  const res = data?.PointQuery.pointHistoryMyList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const fetchPage = useOncePerCursor((after: string) =>
    fetchMore({
      variables: { input: inputOf(filter, after) },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.PointQuery.pointHistoryMyList
        return {
          ...prev,
          PointQuery: {
            ...prev.PointQuery,
            pointHistoryMyList: {
              ...next,
              items: [...prev.PointQuery.pointHistoryMyList.items, ...next.items],
            },
          },
        }
      },
    }),
  )

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchPage(res.nextCursor)
  }

  return { res, loading: loading && !res, loadingMore, error, loadMore }
}
