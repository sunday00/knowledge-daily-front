import { useState } from 'react'
import { useApolloClient, useMutation, type ApolloCache } from '@apollo/client'
import { OPINION_DELETE_MUTATION, OPINION_UPDATE_MUTATION } from '@/graphql/mutations/opinion.ts'
import type { OpinionType } from '@/lib/opinionTypes.ts'
import { DELETED_CONTENT } from '@/lib/opinionStatus.ts'
import { reportError } from '@/lib/errorReporter.ts'

type Result = { success: number; message?: string | null; item: boolean } | undefined

/** 서버 응답을 확인해 실패 메시지를 돌려준다. 성공이면 null. */
function failureOf(result: Result): string | null {
  if (!result || !result.success) return result?.message ?? '서버가 실패를 반환했습니다.'
  // 서버는 _id + 본인(user) 이 일치할 때만 바꾼다. 아니면 item=false
  if (!result.item) return '본인 의견만 수정/삭제할 수 있습니다.'
  return null
}

type OpinionFields = { content: string; type: string | null; status: string }

/**
 * 캐시의 Opinion 필드를 먼저 바꾸고, 되돌릴 때 쓸 이전 값을 돌려준다.
 * (목록 재요청 없이 화면/캐시를 미리 갱신)
 */
function patchOpinion(
  cache: ApolloCache<unknown>,
  _id: string,
  next: Partial<OpinionFields>,
): Partial<OpinionFields> {
  const before: Partial<OpinionFields> = {}
  const fields = Object.fromEntries(
    Object.entries(next).map(([key, value]) => [
      key,
      (prev: unknown) => {
        ;(before as Record<string, unknown>)[key] = prev
        return value
      },
    ]),
  )
  cache.modify({ id: cache.identify({ __typename: 'Opinion', _id }), fields })
  return before
}

/**
 * 서버 반영은 뒤에서 하고, 실패하면 캐시를 되돌리고 상단 에러 배너로 알린다.
 */
async function commitInBackground(
  cache: ApolloCache<unknown>,
  _id: string,
  before: Partial<OpinionFields>,
  label: string,
  run: () => Promise<Result>,
) {
  try {
    const failure = failureOf(await run())
    if (!failure) return
    patchOpinion(cache, _id, before)
    reportError(`[${label} 실패] ${failure}`)
  } catch (e: unknown) {
    patchOpinion(cache, _id, before)
    reportError(`[${label} 실패]`, e)
  }
}

/** 의견 수정. 캐시를 먼저 고쳐 바로 보이게 하고, 서버 반영이 실패하면 되돌린다. */
export function useUpdateOpinion() {
  const client = useApolloClient()
  const [error, setError] = useState<string | null>(null)
  const [mutate] = useMutation(OPINION_UPDATE_MUTATION)

  /** 입력이 올바르면 바로 true (서버 반영은 뒤에서) */
  const submit = (_id: string, raw: string, type: OpinionType): boolean => {
    setError(null)
    const content = raw.trim()
    if (!content) {
      setError('내용을 입력하세요.')
      return false
    }

    // 말머리 없음은 null 로 보내 기존 말머리를 지운다
    const next = { content, type: type || null }
    const before = patchOpinion(client.cache, _id, next)
    void commitInBackground(client.cache, _id, before, '의견 수정', async () => {
      const { data } = await mutate({ variables: { input: { _id, ...next } } })
      return data?.OpinionMutation.opinionUpdate
    })
    return true
  }

  return { submit, error }
}

/** 의견 삭제(서버는 status 를 INACTIVE 로). 캐시를 먼저 삭제 상태로 바꾸고, 실패하면 되돌린다. */
export function useDeleteOpinion() {
  const client = useApolloClient()
  const [mutate] = useMutation(OPINION_DELETE_MUTATION)

  const remove = (_id: string): void => {
    const before = patchOpinion(client.cache, _id, {
      status: 'INACTIVE',
      content: DELETED_CONTENT,
      type: null,
    })
    void commitInBackground(client.cache, _id, before, '의견 삭제', async () => {
      const { data } = await mutate({ variables: { input: { _id } } })
      return data?.OpinionMutation.opinionDelete
    })
  }

  return { remove }
}
