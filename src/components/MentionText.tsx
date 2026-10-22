import { Fragment, useEffect, useId, useState, type MouseEvent } from 'react'
import { useQuery } from '@apollo/client'
import { OPINION_STANDARD_LIST_QUERY } from '@/graphql/queries/opinion.ts'
import { useMention } from '@/components/MentionContext.tsx'
import { markMissingSid, useMissingSids } from '@/lib/missingOpinions.ts'
import { OpinionPeek } from '@/components/OpinionPeek.tsx'
import { Bubble } from '@/components/Bubble.tsx'

/**
 * 본문의 '@숫자' 를 그 의견으로 이동하는 링크로 바꿔 보여준다.
 * - 마우스를 올리거나 포커스하면 링크 근처에 말풍선으로 그 의견을 미리 보여준다.
 *   화면 목록에 있으면 그대로, 없으면(다른 대화 등) 그때 한 건 조회한다.
 * - 없는 의견으로 이미 확인된 @숫자는 비활성.
 * 이동 기능이 없는 곳(MentionProvider 밖)에선 글자 그대로.
 */
export function MentionText({ text }: { text: string }) {
  const mention = useMention()
  const missing = useMissingSids()
  if (!mention) return <>{text}</>

  const parts = text.split(/(@\d+)/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = /^@(\d+)$/.exec(part)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        const sid = Number(m[1])
        if (missing.has(sid)) {
          return (
            <span
              key={i}
              aria-disabled="true"
              title="삭제되었거나 없는 의견입니다"
              className="cursor-not-allowed text-neutral-400 line-through"
            >
              {part}
            </span>
          )
        }
        return <MentionLink key={i} sid={sid} label={part} />
      })}
    </>
  )
}

function MentionLink({ sid, label }: { sid: number; label: string }) {
  const { jumpToSid, findBySid } = useMention()!
  const bubbleId = useId()
  // 화면 목록에 있으면 그대로, 없으면(다른 대화 등) 처음 마우스를 올리거나 포커스할 때 한 건 조회
  const local = findBySid(sid)
  const [wanted, setWanted] = useState(false)
  const { data, loading } = useQuery(OPINION_STANDARD_LIST_QUERY, {
    variables: { input: { size: 1, search: { sid: { eq: sid } } } },
    skip: !!local || !wanted,
    fetchPolicy: 'cache-first',
  })
  const fetched = data?.OpinionQuery.opinionStandardList
  const opinion = local ?? fetched?.items[0]

  // 조회했는데 없으면 없는 의견으로 기억 → 이 링크와 같은 @숫자 링크들이 비활성으로 바뀐다
  useEffect(() => {
    if (fetched?.success && fetched.items.length === 0) markMissingSid(sid)
  }, [fetched, sid])

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    jumpToSid(sid)
  }
  const want = () => setWanted(true)

  return (
    <span className="group relative inline-block" onMouseEnter={want} onFocus={want}>
      <a
        href={`#sid-${sid}`}
        onClick={onClick}
        aria-describedby={bubbleId}
        className="text-brand-600 dark:text-brand-500 no-underline hover:underline"
      >
        {label}
      </a>
      {/* 링크 위에 뜨는 말풍선. 마우스 오버 / 키보드 포커스 때만 보인다 */}
      <Bubble
        id={bubbleId}
        role="tooltip"
        className="pointer-events-none invisible bottom-full left-0 mb-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {opinion ? (
          <OpinionPeek opinion={opinion} />
        ) : (
          <span className="block text-neutral-500">
            {loading || !wanted ? `@${sid} 불러오는 중...` : `@${sid} 의견을 불러오지 못했습니다.`}
          </span>
        )}
      </Bubble>
    </span>
  )
}
