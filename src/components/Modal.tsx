import { useEffect, useId, useRef, type ReactNode } from 'react'

export type ModalTone = 'default' | 'success' | 'danger' | 'warning'

type Props = {
  open: boolean
  /** 닫기(Esc, 바깥 누르기, 닫기 버튼) 요청. dismissible 이 false 면 부르지 않는다. */
  onClose: () => void
  title: ReactNode
  /** 제목 위 큰 아이콘. tone 에 맞는 기본 아이콘을 쓰려면 생략 */
  icon?: ReactNode
  tone?: ModalTone
  children?: ReactNode
  /** 아래 버튼 줄. ModalButton 을 쓴다. */
  footer?: ReactNode
  /** false 면 Esc·바깥 누르기로 닫히지 않는다. (처리 중일 때) */
  dismissible?: boolean
}

const TONE_ICON_CLASS: Record<ModalTone, string> = {
  default: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-indigo-300',
  success: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
}

/**
 * 공용 모달. 모든 모달은 이걸 써서 모양과 동작(포커스 가두기, Esc, 바깥 누르기)을 맞춘다.
 * 브라우저 <dialog>(showModal)를 써서 뒤 화면은 눌리지 않고 스크린리더도 모달로 읽는다.
 */
export function Modal({
  open,
  onClose,
  title,
  icon,
  tone = 'default',
  children,
  footer,
  dismissible = true,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal 은 첫 버튼에 포커스를 준다. autoFocus 로 고른 버튼이 있으면 그쪽으로.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const iconNode = icon ?? DEFAULT_ICON[tone]

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc: 브라우저가 바로 닫지 않게 막고, 열고 닫기는 open 으로만 한다.
      onCancel={(e) => {
        e.preventDefault()
        if (dismissible) onClose()
      }}
      // 바깥(backdrop) 누르기. dialog 자신이 눌린 경우만 바깥이다.
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
      className="modal w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-0 text-neutral-800 dark:text-neutral-100 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="space-y-4 p-6 text-center">
          {iconNode && (
            <div
              aria-hidden
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${TONE_ICON_CLASS[tone]}`}
            >
              {iconNode}
            </div>
          )}
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {children && (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">{children}</div>
          )}
          {footer && <div className="flex justify-center gap-2 pt-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

const BUTTON_CLASS = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  secondary:
    'border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100',
}

/** 모달 아래 버튼 */
export function ModalButton({
  variant = 'secondary',
  onClick,
  autoFocus,
  disabled,
  children,
}: {
  variant?: keyof typeof BUTTON_CLASS
  onClick: () => void
  autoFocus?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLButtonElement>(null)
  // 이미 열린 모달의 내용이 바뀌어 새로 생긴 버튼(진행 → 결과)이면 여기서 포커스.
  // 처음 열릴 때는 아직 showModal 전이라 Modal 이 data-autofocus 를 찾아 준다.
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      data-autofocus={autoFocus || undefined}
      disabled={disabled}
      className={`min-w-24 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${BUTTON_CLASS[variant]}`}
    >
      {children}
    </button>
  )
}

/** 모달 안 로딩 표시 (처리 중 모달의 아이콘 자리) */
export function ModalSpinner() {
  return (
    <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
  )
}

const svgProps = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const DEFAULT_ICON: Record<ModalTone, ReactNode> = {
  default: null,
  success: (
    <svg {...svgProps}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  ),
  danger: (
    <svg {...svgProps}>
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  warning: (
    <svg {...svgProps}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
}
