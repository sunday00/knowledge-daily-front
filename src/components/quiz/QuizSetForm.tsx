import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { QuizSetDraft } from '@/actions/quiz.ts'
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea.ts'
import { QUIZ_BRIEF_MAX, QUIZ_TITLE_MAX } from '@/lib/quiz.ts'
import { QuizTagInput } from './QuizTagInput'

const inputClass =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500'

const EMPTY: QuizSetDraft = { title: '', brief: '', description: '', tagNames: [] }

/** 퀴즈 세트 입력 (제목, 소제목, 소개글, 태그). 만들기 1단계와 수정에서 같이 쓴다. */
export function QuizSetForm({
  initial = EMPTY,
  onSubmit,
  saving,
  error,
  submitLabel,
  savingLabel,
  cancelTo,
  onCancel,
}: {
  initial?: QuizSetDraft
  onSubmit: (draft: QuizSetDraft) => void | Promise<void>
  saving: boolean
  error: string | null
  submitLabel: string
  savingLabel: string
  /** 취소 링크 주소 (onCancel 이 없을 때) */
  cancelTo?: string
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(initial.title)
  const [brief, setBrief] = useState(initial.brief)
  const [description, setDescription] = useState(initial.description)
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames)
  const textareaRef = useAutoResizeTextarea(description, 480)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    void onSubmit({ title, brief, description, tagNames })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          required
          maxLength={QUIZ_TITLE_MAX}
          placeholder="예: 세계의 수도 맞히기"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">
          소제목 <span className="text-neutral-400">(선택)</span>
        </span>
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          disabled={saving}
          maxLength={QUIZ_BRIEF_MAX}
          placeholder="목록에 함께 보이는 짧은 소개"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">
          소개글 <span className="text-neutral-400">(선택)</span>
        </span>
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          rows={4}
          placeholder="어떤 퀴즈인지 소개해 주세요."
          className={`${inputClass} min-h-28 resize-none`}
        />
      </label>

      <div className="space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">
          태그 <span className="text-neutral-400">(선택)</span>
        </span>
        <QuizTagInput value={tagNames} onChange={setTagNames} disabled={saving} />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>
            취소
          </button>
        ) : cancelTo ? (
          <Link to={cancelTo} className="btn no-underline">
            취소
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
