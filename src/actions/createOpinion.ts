import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import type { OpinionType } from '@/lib/opinionTypes.ts'
import { OPINION_MAX_LENGTH } from '@/lib/opinionLimits.ts'
import { OPINION_CREATE_MUTATION } from '@/graphql/mutations/opinion.ts'
import { OPINION_ITEM_FRAGMENT } from '@/graphql/queries/opinion.ts'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'

// 기존 의견 데이터와 같은 스키마 버전
const OPINION_VERSION = '1.0'

export type CreatedOpinion = OpinionItemFieldsFragment

/** 등록 결과: 화면에 그릴 의견 + 그 의견이 속한 대화(thread) _id */
export type CreatedResult = { opinion: CreatedOpinion; threadId: string }

/**
 * sense 에 의견을 남긴다.
 * - parent(thread _id) 가 없으면 새 대화를 만들고, 있으면 그 대화에 의견을 단다.
 * 다시 조회하지 않고 등록 결과(_id/sid/createdAt/parent) + 입력값으로 의견을 만들어 캐시에 넣는다.
 * 목록에 붙이는 건 화면 쪽에서.
 */
export function useCreateOpinion(senseId: string, parent?: string) {
  const client = useApolloClient()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: sending }] = useMutation(OPINION_CREATE_MUTATION)

  /** 화면의 카운트만 올린다: 원글 [대화수, 의견수], 답글이면 그 대화의 의견수 */
  const bumpCounts = () => {
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Sense', _id: senseId }),
      fields: {
        opinionsCnt: (prev) => {
          const [threadCnt = 0, opinionCnt = 0] = Array.isArray(prev) ? (prev as number[]) : []
          return [threadCnt + (parent ? 0 : 1), opinionCnt + 1]
        },
      },
    })
    if (parent) {
      client.cache.modify({
        id: client.cache.identify({ __typename: 'ThreadResItem', _id: parent }),
        fields: { opinionsCnt: (prev) => (typeof prev === 'number' ? prev + 1 : prev) },
      })
    }
  }

  /** 성공하면 새 의견과 대화 _id, 실패하면 null */
  const submit = async (raw: string, type: OpinionType = ''): Promise<CreatedResult | null> => {
    setError(null)
    const content = raw.trim()
    if (content.length > OPINION_MAX_LENGTH) {
      setError(`${OPINION_MAX_LENGTH}자 이내로 입력하세요.`)
      return null
    }
    if (!content) {
      setError('내용을 입력하세요.')
      return null
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
        return null
      }
      const result = data?.OpinionMutation.opinionCreate
      if (!result || !result.success) {
        setError(result?.message ?? '서버가 실패를 반환했습니다.')
        return null
      }

      const { _id, sid, createdAt, parent: threadId } = result.item
      // __typename 은 캐시 정규화(Opinion/User)에 필요해서 넣는다. 생성 타입엔 없어 단언한다
      const created = {
        __typename: 'Opinion',
        _id,
        sid,
        createdAt,
        content,
        type: type || null,
        status: 'ACTIVE',
        reactionsCnt: [],
        // 내 의견이라 차단/신고 상태는 없다
        villainStatus: {
          __typename: 'VillainStatus',
          isBlocked: false,
          isSuspected: false,
          status: null,
          result: null,
        },
        user: user
          ? {
              __typename: 'User',
              _id: user.userId,
              nickname: user.nickname,
              villainStatus: {
                __typename: 'VillainStatus',
                isBlocked: false,
                isSuspected: false,
                status: null,
                result: null,
              },
            }
          : null,
      } as CreatedOpinion
      // 캐시에 의견을 넣어 두면 목록에 없더라도 수정/삭제가 같은 방식(cache.modify)으로 반영된다
      client.cache.writeFragment({ fragment: OPINION_ITEM_FRAGMENT, data: created })
      bumpCounts()
      return { opinion: created, threadId }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      return null
    }
  }

  return { submit, sending, error }
}
