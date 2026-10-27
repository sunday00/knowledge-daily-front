import { useEffect, useId, useRef, type ReactNode } from 'react'

export const textButton =
  'rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent'

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
  side = 'bottom',
  buttonClassName = textButton,
  children,
}: {
  label: ReactNode
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 창을 버튼의 어느 쪽 끝에 맞출지 */
  align?: 'left' | 'right'
  /** 창을 버튼 아래 / 위 어느 쪽에 띄울지 (화면 아래 고정 영역이면 top) */
  side?: 'bottom' | 'top'
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
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} ${side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} z-30 w-max max-w-[80vw] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1 text-left font-normal shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
