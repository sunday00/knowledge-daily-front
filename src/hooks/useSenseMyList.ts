import { useEffect, useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import { SENSE_MY_LIST_QUERY } from '@/graphql/queries/sense.ts'
import type { SenseSearchInput } from '@/graphql/__generated__/graphql.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { MY_LIST_PAGE_SIZE, readMyListCache, writeMyListCache } from '@/lib/senseMyListCache.ts'

/** 검색어가 있으면 제목 또는 설명에 포함된 항목을 찾는다. 없으면 빈 search. */
function buildSearch(keyword: string): SenseSearchInput {
  if (!keyword) return {}
  return {
    title: { contains: keyword },
    description: { contains: keyword },
    complex: { or: ['title', 'description'] },
  }
}

const variablesOf = (keyword: string) => ({
  input: { size: MY_LIST_PAGE_SIZE, search: buildSearch(keyword) },
})

export function useSenseMyList(keyword: string) {
  const { user } = useAuth()
  const userId = user?.userId
  const client = useApolloClient()
  const isDefault = !keyword

  // 첫 렌더 전에 localStorage 캐시(10분)를 Apollo 캐시에 심어 둔다.
  // 그래야 cache-first 로 바로 보여주고, 이어지는 fetchMore 도 그대로 동작한다.
  const [hadStoredCache] = useState(() => {
    const stored = userId ? readMyListCache(userId) : null
    if (stored) {
      client.writeQuery({ query: SENSE_MY_LIST_QUERY, variables: variablesOf(''), data: stored })
    }
    return stored !== null
  })

  const { data, previousData, loading, error, fetchMore, networkStatus } = useQuery(
    SENSE_MY_LIST_QUERY,
    {
      variables: variablesOf(keyword),
      // 기본 목록의 저장 캐시가 없거나 만료됐으면 메모리 캐시도 믿지 않고 서버에서 받는다.
      fetchPolicy: isDefault && !hadStoredCache ? 'network-only' : 'cache-first',
      nextFetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
      skip: !userId,
    },
  )

  // 기본 목록(1~5페이지)만 저장. 검색 결과는 저장하지 않는다.
  useEffect(() => {
    if (isDefault && userId && data?.SenseQuery.senseMyList.success) {
      writeMyListCache(userId, data)
    }
  }, [isDefault, userId, data])

  // 검색어가 바뀌어 새 결과를 받는 동안 이전 결과를 유지해 목록이 깜빡이지 않게 한다.
  const res = (data ?? previousData)?.SenseQuery.senseMyList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchMore({
      variables: { input: { ...variablesOf(keyword).input, after: res.nextCursor } },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.SenseQuery.senseMyList
        return {
          ...prev,
          SenseQuery: {
            ...prev.SenseQuery,
            senseMyList: {
              ...next,
              items: [...prev.SenseQuery.senseMyList.items, ...next.items],
            },
          },
        }
      },
    })
  }

  return {
    res,
    // 처음 로딩 (보여줄 이전 결과가 없음)
    loading: loading && !res,
    // 검색어 변경으로 다시 불러오는 중
    refreshing: loading && !!res && !loadingMore,
    loadingMore,
    error,
    loadMore,
  }
}
