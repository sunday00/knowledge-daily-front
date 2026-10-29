import { useState, type ReactNode } from 'react'
import { useFragment } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import {
  ASK_REACTIONS_FRAGMENT,
  OPINION_REACTIONS_FRAGMENT,
  SENSE_REACTIONS_FRAGMENT,
  THREAD_REACTIONS_FRAGMENT,
} from '@/graphql/queries/reaction.ts'
import { reactionTypename, useToggleReaction, type ReactionTarget } from '@/actions/reaction.ts'
import { REACTIONS, reactionOf, type ReactionCode } from '@/lib/reactions.ts'
import { Popover } from '@/components/Popover.tsx'

// 대상별로 캐시에서 리액션 집계를 읽을 fragment
const REACTIONS_FRAGMENT = {
  Sense: SENSE_REACTIONS_FRAGMENT,
  Ask: ASK_REACTIONS_FRAGMENT,
  Opinion: OPINION_REACTIONS_FRAGMENT,
  Thread: THREAD_REACTIONS_FRAGMENT,
}

const chipBase =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums transition-colors'
const chipMine =
  'border-brand-500/60 bg-brand-50 text-brand-700 dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-200'
const chipOthers =
  'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'

/**
 * 카드 아래 리액션 줄: 쌓인 리액션(이모지 + 갯수, 내가 한 건 강조)과 리액션 고르기 버튼.
 * - 집계는 캐시에서 읽어, 토글하면 목록을 다시 받지 않아도 바로 바뀐다.
 * - 로그인했으면 칩을 눌러 내 리액션을 넣고 뺄 수 있다. 비로그인이면 보기만.
 * 대화록 카드처럼 카드 전체가 링크인 곳에서도 눌리도록 relative z-1.
 */
export function ReactionBar({
  target,
  label,
  pickerSide = 'bottom',
}: {
  target: ReactionTarget
  /** 리액션 줄 앞에 붙는 설명 (줄이 숨겨지면 같이 숨는다) */
  label?: ReactNode
  /** 리액션 고르기 창을 버튼 아래 / 위 어디에 띄울지 */
  pickerSide?: 'bottom' | 'top'
}) {
  const { user } = useAuth()
  const { toggle } = useToggleReaction()
  const [open, setOpen] = useState(false)
  const { data } = useFragment({
    fragment: REACTIONS_FRAGMENT[target.entity],
    from: { __typename: reactionTypename(target.entity), _id: target.id },
  })
  // useFragment 는 부분 데이터(DeepPartial)를 줄 수 있어 완전한 항목만 쓴다
  const reactions = (data?.reactionsCnt ?? []).flatMap((r) =>
    r?.name && typeof r.cnt === 'number' ? [{ name: r.name, cnt: r.cnt, me: !!r.me }] : [],
  )
  const mineOf = (code: string) => !!reactions.find((r) => r.name === code)?.me

  if (!user && reactions.length === 0) return null

  const pick = (code: ReactionCode) => {
    toggle(target, code, mineOf(code))
    setOpen(false)
  }

  return (
    <div className={`relative flex flex-wrap items-center gap-1.5 ${open ? 'z-30' : 'z-1'}`}>
      {label}
      {reactions.map((r) => {
        const { emoji, label } = reactionOf(r.name)
        const title = `${label} ${r.cnt}${r.me ? ' · 나도 남김' : ''}`
        if (!user) {
          return (
            <span key={r.name} title={title} className={`${chipBase} ${chipOthers}`}>
              <span aria-hidden>{emoji}</span>
              <span className="sr-only">{label}</span>
              {r.cnt}
            </span>
          )
        }
        return (
          <button
            key={r.name}
            type="button"
            title={title}
            aria-pressed={r.me}
            onClick={() => toggle(target, r.name as ReactionCode, r.me)}
            className={`${chipBase} ${r.me ? chipMine : `${chipOthers} hover:bg-neutral-100 dark:hover:bg-neutral-800`}`}
          >
            <span aria-hidden>{emoji}</span>
            <span className="sr-only">{label}</span>
            {r.cnt}
          </button>
        )
      })}

      {user && (
        <Popover
          label={<AddReactionIcon />}
          title="리액션 남기기"
          open={open}
          onOpenChange={setOpen}
          align="left"
          side={pickerSide}
          buttonClassName={`${chipBase} ${chipOthers} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
        >
          <div className="grid grid-cols-6 gap-0.5" role="group" aria-label="리액션 고르기">
            {REACTIONS.map(({ code, emoji, label }) => {
              const mine = mineOf(code)
              return (
                <button
                  key={code}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={mine}
                  onClick={() => pick(code)}
                  className={`flex size-9 items-center justify-center rounded-md text-xl transition-colors ${mine ? 'bg-brand-50 ring-1 ring-brand-500/60 dark:bg-brand-500/15' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </Popover>
      )}
    </div>
  )
}

/** 웃는 얼굴 + 작은 더하기: 리액션 추가 버튼 */
function AddReactionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12.5A8.5 8.5 0 1 1 11.5 4" />
      <path d="M8.5 14.5c.8 1 2 1.6 3.3 1.6s2.5-.6 3.3-1.6" />
      <path d="M9 10h.01M14.5 10h.01" strokeWidth="2.6" />
      <path d="M19 2.5v5M16.5 5h5" />
    </svg>
  )
}
