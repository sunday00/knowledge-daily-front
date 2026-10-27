import { useFragment } from '@apollo/client'
import { OPINION_ITEM_FRAGMENT } from '@/graphql/queries/opinion.ts'
import { OpinionItem } from '@/components/OpinionItem.tsx'
import { ThreadItem } from '@/components/ThreadItem.tsx'

/**
 * 화면에만 임시로 붙여 둔 의견. 캐시의 Opinion 을 읽으므로 수정/삭제가 그대로 반영된다.
 * (등록할 때 writeFragment 로 넣어 둠)
 */
function usePendingOpinion(opinionId: string) {
  const { data, complete } = useFragment({
    fragment: OPINION_ITEM_FRAGMENT,
    from: { __typename: 'Opinion', _id: opinionId },
  })
  return complete ? data : null
}

export function PendingOpinionItem({ opinionId }: { opinionId: string }) {
  const opinion = usePendingOpinion(opinionId)
  return opinion ? <OpinionItem opinion={opinion} isNew /> : null
}

/** 방금 시작한 대화 */
export function PendingThreadItem({
  threadId,
  opinionId,
  senseId,
}: {
  threadId: string
  opinionId: string
  senseId: string
}) {
  const opinion = usePendingOpinion(opinionId)
  if (!opinion) return null
  return (
    <ThreadItem
      thread={{
        _id: threadId,
        opinionsCnt: 1,
        createdAt: opinion.createdAt,
        reactionsCnt: [],
        opinion,
      }}
      senseId={senseId}
      isNew
    />
  )
}
