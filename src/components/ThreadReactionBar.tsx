import { useFragment, useQuery } from '@apollo/client'
import { THREAD_REACTIONS_FRAGMENT, THREAD_REACTIONS_QUERY } from '@/graphql/queries/reaction.ts'
import { ReactionBar } from '@/components/ReactionBar.tsx'

/**
 * 대화 페이지 하단 입력창 위의 대화록(thread) 리액션.
 * 대화록 목록을 거쳐 왔으면 캐시에 있는 걸 쓰고, 없으면(새로고침 등) 그 대화 한 건만 받는다.
 */
export function ThreadReactionBar({ threadId }: { threadId: string }) {
  const { complete } = useFragment({
    fragment: THREAD_REACTIONS_FRAGMENT,
    from: { __typename: 'ThreadResItem', _id: threadId },
  })
  useQuery(THREAD_REACTIONS_QUERY, {
    variables: { input: { size: 1, search: { _id: { eq: threadId } } } },
    skip: complete,
    fetchPolicy: 'cache-first',
  })

  return (
    <ReactionBar
      target={{ entity: 'Thread', id: threadId }}
      pickerSide="top"
      label={<span className="mr-1 text-xs text-neutral-500">이 대화록에</span>}
    />
  )
}
