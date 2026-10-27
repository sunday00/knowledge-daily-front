import { useEffect, useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { SENSE_STANDARD_LIST_QUERY } from '@/graphql/queries/sense.ts'
import type { SenseStandardListQuery } from '@/graphql/__generated__/graphql.ts'

const TTL_MS = 60 * 60 * 1000 // 1시간

type Cached = {
  data: SenseStandardListQuery
  savedAt: number
}

// 리액션의 '내가 남김(me)' 은 사용자마다 달라 사용자별로 저장한다 (v3: reactionsCnt 추가)
const storageKey = (size: number, userId?: string) =>
  `knowledge-daily:senseList:v3:user=${userId ?? 'guest'}:size=${size}`

function read(size: number, userId?: string): Cached | null {
  try {
    const raw = localStorage.getItem(storageKey(size, userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (Date.now() - parsed.savedAt > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

const readFromStorage = (size: number, userId?: string) => read(size, userId)?.data ?? null

/** 유효한 저장본이 있으면 그 savedAt 을 유지해, 리액션 등으로 다시 저장해도 만료가 늘어나지 않게 한다. */
function writeToStorage(size: number, userId: string | undefined, data: SenseStandardListQuery) {
  const savedAt = read(size, userId)?.savedAt ?? Date.now()
  try {
    localStorage.setItem(
      storageKey(size, userId),
      JSON.stringify({ data, savedAt } satisfies Cached),
    )
  } catch {
    // 저장공간 초과 등은 조용히 무시 — 캐시가 안 될 뿐 기능엔 지장 없음
  }
}

export function useCachedSenseList(size: number) {
  const client = useApolloClient()
  const userId = useAuth().user?.userId
  const variables = { input: { size, search: { status: { eq: 'ACTIVE' as const } } } }

  // 저장본이 있으면 첫 렌더 전에 Apollo 캐시에 심어 두고 cache-first 로 보여준다.
  // 그래야 리액션 토글처럼 캐시를 고치는 변경이 화면(과 다시 저장되는 저장본)에도 반영된다.
  const [hadStored] = useState(() => {
    const stored = readFromStorage(size, userId)
    if (stored) client.writeQuery({ query: SENSE_STANDARD_LIST_QUERY, variables, data: stored })
    return stored !== null
  })

  const { data, loading, error } = useQuery(SENSE_STANDARD_LIST_QUERY, {
    variables,
    fetchPolicy: hadStored ? 'cache-first' : 'network-only',
    nextFetchPolicy: 'cache-first',
  })

  useEffect(() => {
    if (data?.SenseQuery.senseStandardList.success) writeToStorage(size, userId, data)
  }, [size, userId, data])

  return { data, loading: loading && !data, error }
}
