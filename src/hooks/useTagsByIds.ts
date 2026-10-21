import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { TAG_STANDARD_LIST_QUERY } from '@/graphql/queries/tag.ts'

/** 태그 id 목록으로 이름을 조회한다. (notify focusOn 은 id 만 들고 있음) */
export function useTagsByIds(ids: string[]) {
  const { data, loading } = useQuery(TAG_STANDARD_LIST_QUERY, {
    variables: { input: { size: ids.length, search: { _id: { mul: ids } } } },
    skip: ids.length === 0,
  })

  const names = useMemo(
    () => new Map(data?.TagQuery.tagStandardList.items.map((t) => [t._id, t.name])),
    [data],
  )

  return { names, loading: ids.length > 0 && loading && !data }
}
