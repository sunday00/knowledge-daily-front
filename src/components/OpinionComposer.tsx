import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useCreateOpinion, type CreatedResult } from '@/actions/createOpinion.ts'
import type { OpinionType } from '@/lib/opinionTypes.ts'
import { OpinionTypeSelect } from '@/components/OpinionTypeSelect.tsx'
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea.ts'
import { useMention } from '@/components/MentionContext.tsx'
import { SUBMIT_SHORTCUT_LABEL, useSubmitShortcut } from '@/hooks/useSubmitShortcut.ts'

/**
 * 화면 하단에 떠 있는 의견 입력창. 페이지 본문이 가려지지 않도록
 * 사용하는 쪽에서 하단 여백(pb-40 정도)을 두어야 한다.
 */
type Props = {
  senseId: string
  /** 있으면 이 대화(thread _id)에 의견을 단다. 없으면 새 대화. */
  parent?: string
  placeholder?: string
  /** 등록 성공 후 새 의견으로 호출 (화면 목록에 붙이고 그 의견으로 스크롤 등) */
  onCreated?: (created: CreatedResult) => void
}

export function OpinionComposer(props: Props) {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-3">
        {user ? (
          <ComposerForm {...props} />
        ) : (
          <p className="text-sm text-neutral-500">
            의견을 남기려면{' '}
            <Link to="/login" state={{ from: location.pathname }} className="text-brand-600">
              로그인
            </Link>
            하세요.
          </p>
        )}
      </div>
    </div>
  )
}

function ComposerForm({ senseId, parent, placeholder = '의견을 남겨 보세요', onCreated }: Props) {
  const [content, setContent] = useState('')
  const [type, setType] = useState<OpinionType>('')
  const { submit, sending, error } = useCreateOpinion(senseId, parent)
  const textareaRef = useAutoResizeTextarea(content)
  const selectRef = useRef<HTMLSelectElement>(null)

  // 등록 직후엔 말머리 선택으로 포커스. (보내는 동안 disabled 라 풀린 뒤에 옮긴다)
  const [focusSelect, setFocusSelect] = useState(false)
  useEffect(() => {
    if (!focusSelect || sending) return
    setFocusSelect(false)
    selectRef.current?.focus({ preventScroll: true })
  }, [focusSelect, sending])

  // 목록의 @sid 를 누르면 마지막 커서 위치에 '@sid ' 를 넣고 입력창에 포커스
  const mention = useMention()
  const registerRef = useRef(mention?.register)
  registerRef.current = mention?.register
  useEffect(() => {
    const insert = (sid: number) => {
      const el = textareaRef.current
      const token = `@${sid} `
      setContent((prev) => {
        // textarea 는 포커스를 잃어도 마지막 커서 위치를 기억한다
        const at = el ? Math.min(el.selectionStart, prev.length) : prev.length
        const before = prev.slice(0, at)
        const after = prev.slice(at)
        // 앞 글자와 붙지 않도록 공백 하나
        const glue = before && !/\s$/.test(before) ? ' ' : ''
        const next = before + glue + token + after
        const caret = (before + glue + token).length
        requestAnimationFrame(() => {
          el?.focus()
          el?.setSelectionRange(caret, caret)
        })
        return next
      })
    }
    registerRef.current?.(insert)
    return () => registerRef.current?.(null)
  }, [textareaRef])

  const send = async () => {
    if (sending) return
    const created = await submit(content, type)
    if (created) {
      setContent('')
      setType('')
      setFocusSelect(true)
      onCreated?.(created)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send()
  }

  // Enter 는 줄바꿈, Ctrl/Cmd + Enter 로 등록
  const shortcut = useSubmitShortcut(() => void send())

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <div className="flex items-end gap-2">
        <OpinionTypeSelect ref={selectRef} value={type} onChange={setType} disabled={sending} />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          {...shortcut}
          rows={1}
          placeholder={`${placeholder} (${SUBMIT_SHORTCUT_LABEL} 등록)`}
          aria-label="의견 입력"
          disabled={sending}
          className="min-w-0 flex-1 resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          title={SUBMIT_SHORTCUT_LABEL}
          disabled={sending || !content.trim()}
          className="shrink-0 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 px-4 py-2 text-white transition-colors"
        >
          {sending ? '등록 중...' : '등록'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  )
}
