import type { CSSProperties } from 'react'
import { useQuery } from '@apollo/client'
import { OPINION_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'
import { useMention } from '@/components/MentionContext.tsx'
import { OpinionPeek } from '@/components/OpinionPeek.tsx'
import { Bubble } from '@/components/Bubble.tsx'

/**
 * 입력창의 @sid 에 커서가 있을 때 그 @sid 바로 위에 말풍선으로 의견을 보여준다.
 * 화면에 이미 있는 의견이면 그대로 쓰고, 없으면 sid 로 한 건만 조회한다(캐시 우선).
 */
export function MentionPreview({
  sid,
  style,
  tailLeft,
}: {
  sid: number
  style: CSSProperties
  tailLeft: number
}) {
  const local = useMention()?.findBySid(sid)
  const { data, loading } = useQuery(OPINION_STANDARD_LIST_QUERY, {
    variables: { input: { size: 1, search: { sid: { eq: sid } } } },
    skip: !!local,
    fetchPolicy: 'cache-first',
  })
  const opinion = local ?? data?.OpinionQuery.opinionStandardList.items[0]

  return (
    <Bubble role="status" style={style} tailLeft={tailLeft} className="pointer-events-none">
      {opinion ? (
        <OpinionPeek opinion={opinion} />
      ) : (
        <span className="block text-neutral-500">
          {loading ? `@${sid} 불러오는 중...` : `@${sid} 의견을 찾을 수 없습니다.`}
        </span>
      )}
    </Bubble>
  )
}
