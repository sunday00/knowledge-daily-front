import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { OPINION_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'
import type { CreatedResult } from '@/actions/createOpinion.ts'

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
  const { data, loading, error, fetchMore, updateQuery, networkStatus } = useQuery(
    OPINION_STANDARD_LIST_QUERY,
    {
      variables: variablesOf(threadId),
      // 페이지에 들어올 때마다 새로 그리되, 캐시에 있으면 재요청하지 않는다 (새로고침 시에만 서버)
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    },
  )

  /**
   * 화면에만 붙여 둔 임시 의견 _id (캐시 목록엔 없음).
   * 아직 받지 않은 페이지가 있어 캐시 목록 끝에 넣을 수 없는 경우에 쓴다.
   */
  const [pendingIds, setPendingIds] = useState<string[]>([])

  const res = data?.OpinionQuery.opinionStandardList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const fetchPage = async (after: string) => {
    const { data: more } = await fetchMore({
      variables: { input: { ...variablesOf(threadId).input, after } },
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
    // 제자리에 실제로 받아졌으면 임시로 붙여 둔 카드는 뺀다
    const fetched = new Set(more.OpinionQuery.opinionStandardList.items.map((i) => i._id))
    setPendingIds((ids) => ids.filter((id) => !fetched.has(id)))
  }

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchPage(res.nextCursor)
  }

  /**
   * 방금 단 의견을 화면 목록 끝에 붙인다. (목록을 다시 요청하지 않음)
   * - 캐시가 마지막 페이지까지 받아져 있으면 캐시 목록의 맨 뒤에 넣는다. (실제 순서와 같음)
   * - 아직 남은 페이지가 있으면 캐시 목록엔 넣지 않고 화면에만 임시로 붙인다.
   */
  const appendLocal = ({ opinion }: CreatedResult) => {
    if (!res) return // 목록을 아직 못 받았으면 받을 때 서버에서 함께 온다
    if (res.hasNext) {
      setPendingIds((ids) => [...ids, opinion._id])
    }
    updateQuery((prev) => {
      const list = prev?.OpinionQuery?.opinionStandardList
      if (!list) return prev
      return {
        ...prev,
        OpinionQuery: {
          ...prev.OpinionQuery,
          opinionStandardList: {
            ...list,
            total: (list.total ?? list.items.length) + 1,
            items: list.hasNext ? list.items : [...list.items, opinion],
          },
        },
      }
    })
  }

  return { res, pendingIds, loading: loading && !res, loadingMore, error, loadMore, appendLocal }
}
