import { SayIcon } from '@/components/SayIcon.tsx'
import { reactionOf } from '@/lib/reactions.ts'

type Item = {
  components?: string[] | null
  /** [threadCnt, opinionCnt] */
  opinionsCnt?: number[] | null
  reactionsCnt?: { name: string; cnt: number }[] | null
}

const unsupported = 'text-neutral-400 dark:text-neutral-500'

/**
 * 목록용 리액션 집계와 댓글(의견) 수. 보기 전용.
 * 글의 components 에 없는 기능은 "미지원"으로 표시한다.
 */
export function AskCounts({ item }: { item: Item }) {
  const has = (name: string) => !!item.components?.includes(name)
  const reactions = (item.reactionsCnt ?? []).filter((r) => r.cnt > 0)
  const opinionCnt = item.opinionsCnt?.[1] ?? 0

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2 text-neutral-500">
      {has('Reaction') ? (
        reactions.map((r) => {
          const { emoji, label } = reactionOf(r.name)
          return (
            <span
              key={r.name}
              title={`${label} ${r.cnt}`}
              className="inline-flex items-center gap-0.5 tabular-nums"
            >
              <span aria-hidden>{emoji}</span>
              <span className="sr-only">{label}</span>
              {r.cnt}
            </span>
          )
        })
      ) : (
        <span className={unsupported}>리액션 미지원</span>
      )}
      {has('Opinion') ? (
        <span title="댓글 수" className="inline-flex items-center gap-1 tabular-nums">
          <SayIcon size={14} label="댓글 수" />
          {opinionCnt}
        </span>
      ) : (
        <span className={unsupported}>댓글 미지원</span>
      )}
    </div>
  )
}
