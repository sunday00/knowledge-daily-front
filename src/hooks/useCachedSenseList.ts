import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { SENSE_STANDARD_LIST_QUERY } from '@/graphql/queries/sense.ts'
import type { SenseStandardListQuery } from '@/graphql/__generated__/graphql.ts'

const TTL_MS = 60 * 60 * 1000 // 1시간

type Cached = {
  data: SenseStandardListQuery
  savedAt: number
}

const storageKey = (size: number) => `knowledge-daily:senseList:v1:size=${size}`

function readFromStorage(size: number): SenseStandardListQuery | null {
  try {
    const raw = localStorage.getItem(storageKey(size))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (Date.now() - parsed.savedAt > TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeToStorage(size: number, data: SenseStandardListQuery) {
  try {
    const payload: Cached = { data, savedAt: Date.now() }
    localStorage.setItem(storageKey(size), JSON.stringify(payload))
  } catch {
    // 저장공간 초과 등은 조용히 무시 — 캐시가 안 될 뿐 기능엔 지장 없음
  }
}

export function useCachedSenseList(size: number) {
  const [cached, setCached] = useState<SenseStandardListQuery | null>(() => readFromStorage(size))

  useEffect(() => {
    setCached(readFromStorage(size))
  }, [size])

  const { data, loading, error } = useQuery(SENSE_STANDARD_LIST_QUERY, {
    variables: { input: { size, search: { status: { eq: 'ACTIVE' } } } },
    skip: cached !== null,
    fetchPolicy: 'network-only',
    onCompleted: (fresh) => {
      writeToStorage(size, fresh)
      setCached(fresh)
    },
  })

  return {
    data: cached ?? data,
    loading: cached === null && loading,
    error,
  }
}
