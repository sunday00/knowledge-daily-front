import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import { REPORT_MAX_LENGTH, useReportOpinion, useToggleBlock } from '@/actions/villain.ts'
import { CharCount } from '@/components/CharCount.tsx'

type Opinion = Pick<OpinionItemFieldsFragment, '_id' | 'villainStatus' | 'user'>

const REPORT_REASONS = [
  '스팸·광고',
  '욕설·비하',
  '허위 정보',
  '음란·불쾌한 내용',
  '개인정보 노출',
  '기타',
] as const

const textButton =
  'rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent'

const menuItem =
  'block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'

/**
 * 남의 의견에 붙는 [차단] [신고] 버튼. 누르면 버튼 아래에 작은 창이 뜬다.
 * - 차단: 이 의견만 / 이 유저의 의견 모두. 이미 차단했으면 해제.
 * - 신고: 사유를 골라 접수. 처리 전이면 '신고됨' 으로 막는다.
 * 대화록 카드처럼 카드 전체가 링크인 곳에서도 눌리도록 relative z-1 로 띄운다.
 */
export function OpinionVillainMenu({ opinion }: { opinion: Opinion }) {
  const [open, setOpen] = useState<'block' | 'report' | null>(null)
  const { toggle } = useToggleBlock()
  const opinionBlocked = !!opinion.villainStatus?.isBlocked
  const user = opinion.user
  const userBlocked = !!user?.villainStatus?.isBlocked
  const reported = !!opinion.villainStatus?.isSuspected
  const close = () => setOpen(null)

  return (
    <div className="relative z-1 flex items-center gap-1">
      <Popover
        label={opinionBlocked || userBlocked ? '차단됨' : '차단'}
        title="차단 / 차단 해제"
        open={open === 'block'}
        onOpenChange={(v) => setOpen(v ? 'block' : null)}
      >
        <button
          type="button"
          className={menuItem}
          onClick={() => {
            toggle({ entity: 'Opinion', id: opinion._id }, !opinionBlocked)
            close()
          }}
        >
          {opinionBlocked ? '이 의견 차단 해제' : '이 의견만 가리기'}
        </button>
        {user && (
          <button
            type="button"
            className={menuItem}
            onClick={() => {
              toggle({ entity: 'User', id: user._id }, !userBlocked)
              close()
            }}
          >
            {userBlocked ? (
              <>
                <b className="font-medium">{user.nickname}</b>님 차단 해제
              </>
            ) : (
              <>
                <b className="font-medium">{user.nickname}</b>님의 의견 모두 가리기
              </>
            )}
          </button>
        )}
      </Popover>

      {reported ? (
        <button type="button" className={textButton} disabled title="신고가 접수되어 처리 중입니다">
          신고됨
        </button>
      ) : (
        <Popover
          label="신고"
          title="이 의견 신고"
          open={open === 'report'}
          onOpenChange={(v) => setOpen(v ? 'report' : null)}
        >
          <ReportForm opinionId={opinion._id} onDone={close} />
        </Popover>
      )}
    </div>
  )
}

function ReportForm({ opinionId, onDone }: { opinionId: string; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const { report, sending, error } = useReportOpinion()
  const name = useId()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const quest = detail.trim() ? `[${reason}] ${detail.trim()}` : reason
    if (await report(opinionId, reason && quest)) onDone()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 p-1">
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          신고 사유
        </legend>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <input
                type="radio"
                name={name}
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-brand-600"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        maxLength={REPORT_MAX_LENGTH}
        placeholder="자세한 내용 (선택)"
        aria-label="신고 내용"
        className="block w-full resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <CharCount length={detail.length} max={REPORT_MAX_LENGTH} />
        <button type="button" className="btn text-sm" onClick={onDone}>
          취소
        </button>
        <button
          type="submit"
          disabled={!reason || sending}
          className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 px-3 py-1.5 text-sm text-white transition-colors"
        >
          {sending ? '접수 중...' : '신고'}
        </button>
      </div>
    </form>
  )
}

/** 버튼 + 그 아래 뜨는 작은 창. 바깥을 누르거나 Esc 로 닫는다. */
function Popover({
  label,
  title,
  open,
  onOpenChange,
  children,
}: {
  label: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onOpenChange(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={title}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className={textButton}
      >
        {label}
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title}
          className="absolute right-0 top-full z-30 mt-1 w-72 max-w-[80vw] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1 text-left shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}
