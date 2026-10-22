import { useState } from 'react'
import { useMutation } from '@apollo/client'
import type { OpinionType } from '@/lib/opinionTypes.ts'
import { OPINION_CREATE_MUTATION } from '@/graphql/mutations/opinion.ts'
import { SENSE_ONE_QUERY } from '@/graphql/queries/sense.ts'
import {
  OPINION_STANDARD_LIST_QUERY,
  THREAD_STANDARD_LIST_QUERY,
} from '@/graphql/queries/opinion.ts'

// 기존 의견 데이터와 같은 스키마 버전
const OPINION_VERSION = '1.0'

/**
 * sense 에 의견을 남긴다.
 * - parent(thread _id) 가 없으면 새 대화를 만들고, 있으면 그 대화에 의견을 단다.
 * 성공하면 대화록/의견 목록/카운트를 다시 불러온다.
 */
export function useCreateOpinion(senseId: string, parent?: string) {
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: sending }] = useMutation(OPINION_CREATE_MUTATION, {
    // 화면에 떠 있지 않은 쿼리를 넣으면 Apollo 가 경고하므로 상황에 맞는 것만
    refetchQueries: parent
      ? // 대화록은 상세 페이지로 돌아갈 때 다시 불러온다 (cache-and-network)
        [OPINION_STANDARD_LIST_QUERY, SENSE_ONE_QUERY]
      : [THREAD_STANDARD_LIST_QUERY, SENSE_ONE_QUERY],
    awaitRefetchQueries: true,
  })

  /** 성공하면 true */
  const submit = async (raw: string, type: OpinionType = ''): Promise<boolean> => {
    setError(null)
    const content = raw.trim()
    if (!content) {
      setError('내용을 입력하세요.')
      return false
    }

    try {
      const { data, errors } = await mutate({
        variables: {
          input: {
            targetEntity: 'Sense',
            targetId: senseId,
            parent,
            // 말머리 없음이면 보내지 않는다
            type: type || undefined,
            content,
            attaches: [],
            flags: [],
            links: [],
            version: OPINION_VERSION,
          },
        },
      })
      if (errors?.length) {
        setError(errors.map((e) => e.message).join(', '))
        return false
      }
      const result = data?.OpinionMutation.opinionCreate
      if (!result || !result.success) {
        setError(result?.message ?? '서버가 실패를 반환했습니다.')
        return false
      }
      return true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  return { submit, sending, error }
}
