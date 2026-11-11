import { useState, type FormEvent } from 'react'
import type { SenseKey } from '@/graphql/__generated__/graphql.ts'
import {
  MASKABLE_SENSE_FIELDS,
  QUIZ_OPTIONS_MAX,
  validateQuizItem,
  type QuizItemDraft,
  type QuizSenseCardData,
  type QuizSenseDraft,
} from '@/lib/quiz.ts'
import { QuizSenseCard } from './QuizSenseCard'
import { MySensePicker } from './MySensePicker'

const inputClass =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500'

type Value = Omit<QuizItemDraft, 'key'>

const EMPTY: Value = { senses: [], ask: '', answer: '', answerOptions: ['', ''] }

/**
 * 문항 하나 만들기 / 고치기.
 * 내 상식을 골라 카드로 놓고, 카드마다 가릴 필드를 정한 뒤 문제·정답·보기를 입력해 임시 저장한다.
 * 보기가 없으면 주관식.
 */
export function QuizItemEditor({
  no,
  initial,
  onSave,
  onCancel,
  submitLabel = '임시 저장',
  saving,
  saveError,
}: {
  /** 몇 번 문제인지 */
  no: number
  initial?: Value
  onSave: (value: Value) => void
  /** 없으면 취소 버튼을 두지 않는다 (첫 문항) */
  onCancel?: () => void
  /** 저장 버튼 문구 (공개된 퀴즈를 고칠 땐 바로 서버에 저장) */
  submitLabel?: string
  saving?: boolean
  /** 저장(서버) 실패 사유 */
  saveError?: string | null
}) {
  const [senses, setSenses] = useState<QuizSenseDraft[]>(initial?.senses ?? EMPTY.senses)
  const [ask, setAsk] = useState(initial?.ask ?? EMPTY.ask)
  const [answer, setAnswer] = useState(initial?.answer ?? EMPTY.answer)
  // 고치는 문항이 주관식(보기 없음)이면 주관식으로 연다.
  const [choice, setChoice] = useState(initial ? initial.answerOptions.length > 0 : true)
  const [options, setOptions] = useState<string[]>(
    initial?.answerOptions.length ? initial.answerOptions : EMPTY.answerOptions,
  )
  const [error, setError] = useState<string | null>(null)

  const selectedIds = new Set(senses.map((s) => s.sense._id))

  const addSense = (sense: QuizSenseCardData) =>
    setSenses((prev) =>
      prev.some((s) => s.sense._id === sense._id) ? prev : [...prev, { sense, hide: [] }],
    )
  const removeSense = (id: string) => setSenses((prev) => prev.filter((s) => s.sense._id !== id))
  const toggleHide = (id: string, key: SenseKey) =>
    setSenses((prev) =>
      prev.map((s) =>
        s.sense._id !== id
          ? s
          : {
              ...s,
              hide: s.hide.includes(key) ? s.hide.filter((k) => k !== key) : [...s.hide, key],
            },
      ),
    )

  const setOption = (i: number, text: string) => {
    // 정답으로 고른 보기를 고치면 정답도 따라 바꾼다.
    if (options[i] === answer) setAnswer(text)
    setOptions((prev) => prev.map((o, j) => (j === i ? text : o)))
  }
  const removeOption = (i: number) => {
    if (options[i] === answer) setAnswer('')
    setOptions((prev) => prev.filter((_, j) => j !== i))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value: Value = {
      senses,
      ask: ask.trim(),
      answer: answer.trim(),
      answerOptions: choice ? options.map((o) => o.trim()) : [],
    }
    const invalid = validateQuizItem(value)
    if (invalid) return setError(invalid)
    setError(null)
    onSave(value)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-lg border border-brand-500/40 p-4 md:grid-cols-3"
      aria-label={`${no}번 문제`}
    >
      {/* 왼쪽 2/3: 문항 만들기 */}
      <div className="min-w-0 space-y-5 md:col-span-2">
        <h3 className="text-lg font-semibold">{no}번 문제</h3>

        <fieldset className="space-y-2">
          <legend className="text-sm text-neutral-700 dark:text-neutral-300">문항에 쓸 상식</legend>

          {senses.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center text-sm text-neutral-500">
              <span className="hidden md:inline">오른쪽</span>
              <span className="md:hidden">위</span> 내 상식 목록에서 상식을 추가하세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {senses.map(({ sense, hide }) => (
                <li key={sense._id} className="space-y-2">
                  <QuizSenseCard
                    sense={sense}
                    hide={hide}
                    action={
                      <button
                        type="button"
                        onClick={() => removeSense(sense._id)}
                        aria-label={`${sense.title} 빼기`}
                        className="rounded px-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800"
                      >
                        ×
                      </button>
                    }
                  />
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-neutral-500">가릴 부분:</span>
                    {MASKABLE_SENSE_FIELDS.map((f) => {
                      const on = hide.includes(f.key)
                      return (
                        <button
                          key={f.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleHide(sense._id, f.key)}
                          className={`rounded-full px-2.5 py-0.5 transition-colors ${
                            on
                              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <label className="block space-y-1">
          <span className="block text-sm text-neutral-700 dark:text-neutral-300">문제</span>
          <textarea
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            rows={2}
            placeholder="예: 가려진 나라의 수도는 어디일까요?"
            className={`${inputClass} resize-y`}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-neutral-700 dark:text-neutral-300">답</legend>
          <div className="flex gap-1 text-sm">
            {[
              { on: true, label: '객관식' },
              { on: false, label: '주관식' },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={choice === t.on}
                onClick={() => setChoice(t.on)}
                className={`rounded-md px-3 py-1 ${
                  choice === t.on
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {choice ? (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">보기를 입력하고 정답인 보기를 고르세요.</p>
              <ul className="space-y-2">
                {options.map((o, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quiz-answer"
                      aria-label={`${i + 1}번 보기를 정답으로`}
                      checked={!!o.trim() && o === answer}
                      disabled={!o.trim()}
                      onChange={() => setAnswer(o)}
                    />
                    <input
                      value={o}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`보기 ${i + 1}`}
                      className={`${inputClass} py-1.5 text-sm`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        aria-label={`보기 ${i + 1} 지우기`}
                        className="shrink-0 rounded px-1.5 text-neutral-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {options.length < QUIZ_OPTIONS_MAX && (
                <button
                  type="button"
                  className="btn text-xs px-2 py-1"
                  onClick={() => setOptions((prev) => [...prev, ''])}
                >
                  보기 추가
                </button>
              )}
            </div>
          ) : (
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="정답"
              aria-label="정답"
              className={inputClass}
            />
          )}
        </fieldset>

        {(error ?? saveError) && (
          <p className="text-sm text-red-600 dark:text-red-400">{error ?? saveError}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <button type="button" className="btn" onClick={onCancel} disabled={saving}>
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            {saving ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>

      {/* 오른쪽 1/3: 내 상식 검색 목록. 좁은 화면에선 위로 */}
      <aside
        aria-label="내 상식 목록"
        className="order-first min-w-0 space-y-2 md:order-none md:border-l md:border-neutral-200 md:pl-5 md:dark:border-neutral-800"
      >
        <h4 className="text-sm text-neutral-700 dark:text-neutral-300">내 상식에서 고르기</h4>
        <div className="md:sticky md:top-4">
          <MySensePicker selectedIds={selectedIds} onPick={addSense} />
        </div>
      </aside>
    </form>
  )
}
