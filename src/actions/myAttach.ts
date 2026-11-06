import { ApolloError, useMutation } from '@apollo/client'
import {
  ATTACH_FLAGS_UPDATE_MUTATION,
  DE_RELATE_MY_ATTACH_MUTATION,
} from '@/graphql/mutations/attach.ts'
import { ATTACH_MY_LIST_QUERY } from '@/graphql/queries/attach.ts'

const NOT_FOUND = 'ATTACH_NOT_FOUND'

const failText = (e: unknown, fallback: string) => {
  const code = e instanceof ApolloError ? e.graphQLErrors[0]?.extensions?.code : undefined
  if (code === NOT_FOUND) return '이미지를 찾을 수 없습니다. 이미 버렸거나 내 이미지가 아닙니다.'
  return e instanceof Error ? e.message : fallback
}

/** 내 이미지 별칭(flags) 바꾸기. 최종 목록으로 통째 교체 (서버가 앞뒤 공백 / 빈 값 / 중복 제거) */
export function useUpdateAttachAliases() {
  const [mutate, { loading }] = useMutation(ATTACH_FLAGS_UPDATE_MUTATION, {
    context: { expectedErrorCodes: [NOT_FOUND] },
  })

  /** 실패하면 에러 문구를 던진다 */
  const update = async (_id: string, flags: string[]) => {
    try {
      const { data } = await mutate({
        variables: { input: { _id, flags } },
        // 목록 캐시의 flags 를 바로 바꿔 둔다 (Attach 는 _id 로 정규화돼 있다)
        update: (cache, { data }) => {
          if (!data?.AttachMutation.attachFlagsUpdate.success) return
          cache.modify({
            id: cache.identify({ __typename: 'Attach', _id }),
            fields: { flags: () => flags },
          })
        },
      })
      const res = data?.AttachMutation.attachFlagsUpdate
      if (!res?.success) throw new Error(res?.message ?? '별칭을 저장하지 못했습니다.')
    } catch (e) {
      throw new Error(failText(e, '별칭을 저장하지 못했습니다.'))
    }
  }

  return { update, loading }
}

/** 내 이미지 버리기 (내 목록에서만 빼기). 끝나면 내 이미지 목록을 다시 받는다 */
export function useDeRelateMyAttach() {
  const [mutate, { loading }] = useMutation(DE_RELATE_MY_ATTACH_MUTATION, {
    context: { expectedErrorCodes: [NOT_FOUND] },
    refetchQueries: [ATTACH_MY_LIST_QUERY],
    awaitRefetchQueries: true,
  })

  const deRelate = async (_id: string) => {
    try {
      const { data } = await mutate({ variables: { input: { _id } } })
      const res = data?.AttachMutation.deRelateMyAttach
      if (!res?.success) throw new Error(res?.message ?? '이미지를 버리지 못했습니다.')
    } catch (e) {
      throw new Error(failText(e, '이미지를 버리지 못했습니다.'))
    }
  }

  return { deRelate, loading }
}
