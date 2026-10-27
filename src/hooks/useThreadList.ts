import { useApolloClient, useQuery } from '@apollo/client'
import { THREAD_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'
import { THREAD_REACTIONS_FRAGMENT } from '@/graphql/queries/reaction.ts'
import type { CreatedResult } from '@/actions/createOpinion.ts'
import { useOncePerCursor, usePendingCards } from '@/hooks/usePendingCards.ts'

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
export function useThreadList(targetId: string) {
  const { data, loading, error, fetchMore, updateQuery, networkStatus } = useQuery(
    THREAD_STANDARD_LIST_QUERY,
    {
      variables: variablesOf(targetId),
      skip: !targetId,
      // 페이지에 들어올 때마다 새로 그리되, 캐시에 있으면 재요청하지 않는다 (새로고침 시에만 서버)
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    },
  )
  const client = useApolloClient()
  const cards = usePendingCards<CreatedResult>()

  const res = data?.OpinionQuery.threadStandardList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const fetchPage = useOncePerCursor(async (after: string) => {
    const { data: more } = await fetchMore({
      variables: { input: { ...variablesOf(targetId).input, after } },
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
    // 제자리에 실제로 받아졌으면 임시로 끼워 둔 카드는 뺀다
    cards.drop(new Set(more.OpinionQuery.threadStandardList.items.map((t) => t._id)))
  })

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchPage(res.nextCursor)
  }

  /**
   * 방금 시작한 대화를 지금 보고 있는 목록 끝에 붙인다. (목록을 다시 요청하지 않음)
   * - 마지막 페이지까지 받아져 있으면 캐시 목록의 맨 뒤에 넣는다. (실제 순서와 같음)
   * - 남은 페이지가 있으면 화면에만 끼워 두고, 바로 다음 페이지를 받아 그 뒤에 잇는다.
   */
  const appendLocal = async (created: CreatedResult) => {
    if (!res) return // 목록을 아직 못 받았으면 받을 때 서버에서 함께 온다
    if (res.hasNext) cards.add(created, created.threadId, res.items.length)
    const thread = {
      __typename: 'ThreadResItem' as const,
      _id: created.threadId,
      opinionsCnt: 1,
      createdAt: created.opinion.createdAt,
      reactionsCnt: [],
      opinion: created.opinion,
    }
    // 화면에만 끼워 둔 대화도 리액션을 캐시에서 읽고 고칠 수 있게 넣어 둔다
    client.cache.writeFragment({ fragment: THREAD_REACTIONS_FRAGMENT, data: thread })
    updateQuery((prev) => {
      const list = prev?.OpinionQuery?.threadStandardList
      if (!list) return prev
      return {
        ...prev,
        OpinionQuery: {
          ...prev.OpinionQuery,
          threadStandardList: {
            ...list,
            total: (list.total ?? list.items.length) + 1,
            items: list.hasNext ? list.items : [...list.items, thread],
          },
        },
      }
    })
    if (res.hasNext && res.nextCursor) await fetchPage(res.nextCursor)
  }

  return {
    res,
    rows: cards.rowsOf(res?.items ?? []),
    loading: loading && !res,
    loadingMore,
    error,
    loadMore,
    appendLocal,
  }
}
