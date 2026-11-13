import { useQuery, type OperationVariables, type TypedDocumentNode } from '@apollo/client'
import { useOncePerCursor } from '@/hooks/usePendingCards.ts'

type CursorList = {
  hasNext?: boolean | null
  nextCursor?: string | null
  items: readonly unknown[]
}

/**
 * 커서(after / nextCursor)로 이어 받는 목록. 아래로 내리면 loadMore 로 다음 쪽을 붙인다.
 * pick 은 응답에서 목록을, put 은 이어 붙인 목록을 응답 모양으로 되돌린다.
 */
export function useCursorList<TData, TVars extends OperationVariables, L extends CursorList>({
  query,
  variables,
  pick,
  put,
  skip,
}: {
  query: TypedDocumentNode<TData, TVars>
  /** after 가 있으면 그 다음 쪽 */
  variables: (after?: string) => TVars
  pick: (data: TData) => L
  put: (data: TData, list: L) => TData
  skip?: boolean
}) {
  const { data, loading, error, fetchMore, networkStatus } = useQuery(query, {
    variables: variables(),
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip,
  })
  const res = data ? pick(data) : undefined
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const fetchPage = useOncePerCursor((after: string) =>
    fetchMore({
      variables: variables(after),
      // 제네릭이라 Apollo 의 Unmasked<TData> 와 TData 를 맞춰 준다 (이 훅은 마스킹을 쓰지 않는다)
      updateQuery: (prev, { fetchMoreResult }) => {
        const before = prev as TData
        const next = pick(fetchMoreResult as TData)
        return put(before, {
          ...next,
          items: [...pick(before).items, ...next.items],
        }) as typeof prev
      },
    }),
  )

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchPage(res.nextCursor)
  }

  return { res, loading: loading && !res, loadingMore, error, loadMore }
}
