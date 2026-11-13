import { REACTIONS, type ReactionCode } from '@/lib/reactions.ts'

/** 리액션 이모지 고르기 그리드 (리액션 남기기 창, 내 반응 기록에서 같이 쓴다) */
export function ReactionEmojiGrid({
  isActive,
  onPick,
  label = '리액션 고르기',
}: {
  /** 눌린(고른) 상태로 보일지 */
  isActive: (code: ReactionCode) => boolean
  onPick: (code: ReactionCode) => void
  label?: string
}) {
  return (
    <div className="grid grid-cols-6 gap-0.5" role="group" aria-label={label}>
      {REACTIONS.map(({ code, emoji, label: name }) => {
        const active = isActive(code)
        return (
          <button
            key={code}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={active}
            onClick={() => onPick(code)}
            className={`flex size-9 items-center justify-center rounded-md text-xl transition-colors ${active ? 'bg-brand-50 ring-1 ring-brand-500/60 dark:bg-brand-500/15' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}
