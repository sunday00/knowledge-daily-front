import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useCreateOpinion } from '@/actions/createOpinion.ts'
import { OPINION_TYPES, type OpinionType } from '@/lib/opinionTypes.ts'

const MAX_ROWS_HEIGHT = 160 // px. 이 이상은 입력창 안에서 스크롤

/**
 * 화면 하단에 떠 있는 의견 입력창. 페이지 본문이 가려지지 않도록
 * 사용하는 쪽에서 하단 여백(pb-40 정도)을 두어야 한다.
 */
type Props = {
  senseId: string
  /** 있으면 이 대화(thread _id)에 의견을 단다. 없으면 새 대화. */
  parent?: string
  placeholder?: string
}

export function OpinionComposer({ senseId, parent, placeholder }: Props) {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-3">
        {user ? (
          <ComposerForm senseId={senseId} parent={parent} placeholder={placeholder} />
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

function ComposerForm({ senseId, parent, placeholder = '의견을 남겨 보세요' }: Props) {
  const [content, setContent] = useState('')
  const [type, setType] = useState<OpinionType>('')
  const { submit, sending, error } = useCreateOpinion(senseId, parent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 내용에 맞춰 높이를 늘린다 (최대 MAX_ROWS_HEIGHT)
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_HEIGHT)}px`
  }, [content])

  const send = async () => {
    if (sending) return
    if (await submit(content, type)) {
      setContent('')
      setType('')
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send()
  }

  // Enter 는 줄바꿈, Ctrl/Cmd + Enter 로 등록. 한글 조합 중에는 무시.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <div className="flex items-end gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OpinionType)}
          disabled={sending}
          aria-label="말머리"
          className="shrink-0 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-2 outline-none focus:border-brand-500"
        >
          {OPINION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label="의견 입력"
          disabled={sending}
          className="min-w-0 flex-1 resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
        />
        <button
          type="submit"
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
