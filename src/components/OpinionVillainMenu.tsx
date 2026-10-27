import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import {
  REPORT_MAX_LENGTH,
  useReport,
  useToggleBlock,
  type BlockTarget,
} from '@/actions/villain.ts'
import { CharCount } from '@/components/CharCount.tsx'
import { ReportStatus } from '@/components/ReportStatus.tsx'
import { REPORT_REASONS, type ReportReasonCode } from '@/lib/reportReasons.ts'

type Opinion = Pick<OpinionItemFieldsFragment, '_id' | 'villainStatus' | 'user'>
type OpinionUser = NonNullable<OpinionItemFieldsFragment['user']>

const textButton =
  'rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent'

const menuItem =
  'block w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'

/**
 * 남의 의견에 붙는 [차단] [신고] 버튼. 누르면 버튼 아래에 작은 창이 뜬다.
 * - 차단: 의견 / 유저(그 유저 의견 모두). 이미 차단했으면 해제.
 * - 신고: 사유를 골라 접수. 처리 전이면 '신고됨' 이고, 누르면 지금 처리 단계를 보여준다.
 * 대화록 카드처럼 카드 전체가 링크인 곳에서도 눌리도록 relative z-1 로 띄운다.
 */
export function OpinionVillainMenu({ opinion }: { opinion: Opinion }) {
  const [open, setOpen] = useState<'block' | 'report' | 'status' | null>(null)
  const { toggle } = useToggleBlock()
  const opinionBlocked = !!opinion.villainStatus?.isBlocked
  const user = opinion.user
  const userBlocked = !!user?.villainStatus?.isBlocked
  const reported = !!opinion.villainStatus?.isSuspected
  const close = () => setOpen(null)

  return (
    // 창이 열린 동안엔 아래 카드의 버튼(z-1)보다 위로 올린다
    <div className={`relative flex items-center gap-1 ${open ? 'z-30' : 'z-1'}`}>
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
          {opinionBlocked ? '의견 차단 해제' : '의견 차단'}
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
            {userBlocked ? '유저 차단 해제' : '유저 차단'}
          </button>
        )}
      </Popover>

      {reported && opinion.villainStatus ? (
        <Popover
          label="신고됨"
          title="신고 처리 상태"
          open={open === 'status'}
          onOpenChange={(v) => setOpen(v ? 'status' : null)}
        >
          <ReportStatus target="의견" villainStatus={opinion.villainStatus} />
        </Popover>
      ) : (
        <Popover
          label="신고"
          title="의견 신고"
          open={open === 'report'}
          onOpenChange={(v) => setOpen(v ? 'report' : null)}
        >
          <ReportForm target={{ entity: 'Opinion', id: opinion._id }} onDone={close} />
        </Popover>
      )}
    </div>
  )
}

/**
 * 남의 의견의 닉네임. 누르면 그 유저를 차단 / 차단 해제 / 신고하는 작은 창이 뜬다.
 * 유저 차단은 화면의 그 유저 의견 모두에 바로 반영된다.
 */
export function UserVillainMenu({ user }: { user: OpinionUser }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'report' | 'status'>('menu')
  const { toggle } = useToggleBlock()
  const blocked = !!user.villainStatus?.isBlocked
  const reported = !!user.villainStatus?.isSuspected
  const onOpenChange = (v: boolean) => {
    setOpen(v)
    setView('menu')
  }

  return (
    <Popover
      label={user.nickname}
      title={`${user.nickname}님 차단 / 신고`}
      open={open}
      onOpenChange={onOpenChange}
      align="left"
      buttonClassName="truncate rounded px-0.5 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
    >
      {view === 'report' ? (
        <ReportForm target={{ entity: 'User', id: user._id }} onDone={() => onOpenChange(false)} />
      ) : view === 'status' && user.villainStatus ? (
        <ReportStatus target="유저" villainStatus={user.villainStatus} />
      ) : (
        <>
          <button
            type="button"
            className={menuItem}
            onClick={() => {
              toggle({ entity: 'User', id: user._id }, !blocked)
              onOpenChange(false)
            }}
          >
            {blocked ? '차단 해제' : '유저 차단'}
          </button>
          <button
            type="button"
            className={menuItem}
            // 이미 신고했으면 지금 처리 단계를 보여준다
            onClick={() => setView(reported ? 'status' : 'report')}
          >
            {reported ? '신고됨' : '유저 신고'}
          </button>
        </>
      )}
    </Popover>
  )
}

function ReportForm({ target, onDone }: { target: BlockTarget; onDone: () => void }) {
  const [reason, setReason] = useState<ReportReasonCode | null>(null)
  const [detail, setDetail] = useState('')
  const { report, sending, error } = useReport()
  const name = useId()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (await report(target, reason, detail)) onDone()
  }

  return (
    <form onSubmit={onSubmit} className="w-64 max-w-full space-y-2 p-1">
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          신고 사유
        </legend>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {REPORT_REASONS.map(({ code, label }) => (
            <label
              key={code}
              className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <input
                type="radio"
                name={name}
                value={code}
                checked={reason === code}
                onChange={() => setReason(code)}
                className="accent-brand-600"
              />
              {label}
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

/**
 * 버튼 + 그 아래 뜨는 작은 창. 바깥을 누르거나 Esc 로 닫는다.
 * 카드 전체가 링크인 곳(대화록 카드)에서도 눌리도록 relative z-1.
 */
export function Popover({
  label,
  title,
  open,
  onOpenChange,
  align = 'right',
  buttonClassName = textButton,
  children,
}: {
  label: ReactNode
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 창을 버튼의 어느 쪽 끝에 맞출지 */
  align?: 'left' | 'right'
  buttonClassName?: string
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
    // relative z-1 이 쌓임 맥락을 만들어 창(z-30)도 그 안에 갇히므로,
    // 열린 동안엔 감싼 요소째 올려 아래 카드의 닉네임/버튼(z-1) 위에 뜨게 한다
    <div ref={wrapRef} className={`relative min-w-0 ${open ? 'z-30' : 'z-1'}`}>
      <button
        ref={buttonRef}
        type="button"
        title={title}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className={`max-w-full ${buttonClassName}`}
      >
        {label}
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full z-30 mt-1 w-max max-w-[80vw] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1 text-left font-normal shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
