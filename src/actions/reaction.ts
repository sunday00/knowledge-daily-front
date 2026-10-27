import { useApolloClient, useMutation, type ApolloCache } from '@apollo/client'
import { REACTION_CREATE_MUTATION } from '@/graphql/mutations/reaction.ts'
import { reportError } from '@/lib/errorReporter.ts'
import type { ReactionCode } from '@/lib/reactions.ts'

/** 리액션 대상. 상식 본문은 Sense, 대화록 카드는 Thread, 의견 카드는 Opinion */
export type ReactionTarget = { entity: 'Sense' | 'Opinion' | 'Thread'; id: string }

type ReactionCnt = { __typename?: 'ReactionCnt'; name: string; cnt: number; me: boolean }

// 캐시에서 대상의 타입 이름 (Thread 는 목록에서 ThreadResItem 으로 온다)
export const reactionTypename = (entity: ReactionTarget['entity']) =>
  entity === 'Thread' ? 'ThreadResItem' : entity

/**
 * 캐시의 reactionsCnt 에서 내 리액션(name)을 mine 상태로 맞춘다. 이미 그 상태면 그대로.
 * 고치기 전의 내 상태를 돌려준다.
 */
function setMine(
  cache: ApolloCache<unknown>,
  target: ReactionTarget,
  name: string,
  mine: boolean,
): boolean {
  let before = false
  cache.modify({
    id: cache.identify({ __typename: reactionTypename(target.entity), _id: target.id }),
    fields: {
      reactionsCnt: (prev) => {
        const list = Array.isArray(prev) ? (prev as ReactionCnt[]) : []
        const found = list.find((r) => r.name === name)
        before = !!found?.me
        if (before === mine) return list
        if (!found) return [...list, { __typename: 'ReactionCnt', name, cnt: 1, me: true }]
        return list
          .map((r) => (r.name === name ? { ...r, cnt: r.cnt + (mine ? 1 : -1), me: mine } : r))
          .filter((r) => r.cnt > 0)
      },
    },
  })
  return before
}

/**
 * 리액션 토글. 캐시를 먼저 고쳐 화면에 바로 보이고,
 * 서버 결과(created / deleted)로 맞추며, 실패하면 되돌리고 상단 에러 배너로 알린다.
 */
export function useToggleReaction() {
  const client = useApolloClient()
  const [mutate] = useMutation(REACTION_CREATE_MUTATION)

  const toggle = (target: ReactionTarget, name: ReactionCode, currentlyMine: boolean): void => {
    const want = !currentlyMine
    const before = setMine(client.cache, target, name, want)

    void (async () => {
      try {
        const { data } = await mutate({
          variables: { input: { targetEntity: target.entity, targetId: target.id, name } },
        })
        const result = data?.ReactionMutation.reactionCreate
        if (!result?.success) throw new Error(result?.message ?? '서버가 실패를 반환했습니다.')
        // 서버는 토글이라, 화면이 이미 어긋나 있었다면 서버 결과에 맞춘다
        const res = (result.item as { result?: string } | null)?.result
        if (res === 'created' || res === 'deleted') {
          setMine(client.cache, target, name, res === 'created')
        }
      } catch (e: unknown) {
        setMine(client.cache, target, name, before)
        reportError('[리액션 실패]', e)
      }
    })()
  }

  return { toggle }
}
