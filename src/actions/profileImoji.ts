import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { ARCHIVE_UPSERT_MUTATION } from '@/graphql/mutations/archive.ts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'

// 이 시간 동안 더 고르지 않으면 마지막으로 고른 이모지를 저장한다.
const DEBOUNCE_MS = 500

/**
 * 프로필 이모지 고르기. 고르면 개인설정 저장을 기다리지 않고 바로(디바운스 후) archiveUpsert 로 적용한다.
 * value: 화면에서 고른 _id (없음은 null) / current: 서버에 적용된 _id (아직 못 받았으면 undefined)
 */
export function useProfileImoji() {
  const { data } = useQuery(ARCHIVE_MY_QUERY, { fetchPolicy: 'cache-first' })
  const res = data?.ArchiveQuery.archiveUserOne
  // 처음 만들어진 archive 는 img: null 로 온다.
  const current = res?.success ? (res.item.img?.current?._id ?? null) : undefined

  const [value, setValue] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 이미 보낸 값. 같은 값을 다시 보내지 않는다.
  const sent = useRef<string | null | undefined>(undefined)

  const [mutate, { loading: applying }] = useMutation(ARCHIVE_UPSERT_MUTATION, {
    refetchQueries: [ARCHIVE_MY_QUERY],
    awaitRefetchQueries: true,
  })

  useEffect(() => {
    if (current !== undefined && !initialized) {
      setValue(current)
      setInitialized(true)
    }
  }, [current, initialized])

  const debounced = useDebouncedValue(value, DEBOUNCE_MS)

  useEffect(() => {
    if (!initialized || current === undefined) return
    if (debounced === current || debounced === sent.current) return
    sent.current = debounced
    setError(null)

    const fail = (message: string) => {
      setError(message)
      sent.current = undefined
      // 적용되지 않았으니 화면도 서버 값으로 되돌린다.
      setValue(current)
    }

    mutate({ variables: { input: { img: { current: debounced } } } })
      .then(({ data: d, errors }) => {
        if (errors?.length) return fail(errors.map((e) => e.message).join(', '))
        const result = d?.ArchiveMutation.archiveUpsert
        if (!result?.success || !result.item) fail(result?.message ?? '적용하지 못했습니다.')
      })
      .catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)))
  }, [debounced, current, initialized, mutate])

  return { value, setValue, current, applying, error }
}
