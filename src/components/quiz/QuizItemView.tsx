import type { ReactNode } from 'react'
import type { QuizSenseDraft } from '@/lib/quiz.ts'
import { QuizSenseCard } from './QuizSenseCard'

/** 만든 문항 한눈에 보기 (상식 카드 + 문제 + 정답 표시). 만들기·수정 화면 공용 */
export function QuizItemView({
  no,
  ask,
  answer,
  answerOptions,
  senses,
  actions,
}: {
  no: number
  ask: string
  answer: string
  answerOptions: readonly string[]
  senses: readonly QuizSenseDraft[]
  /** 오른쪽 위 버튼 (수정, 삭제 등) */
  actions?: ReactNode
}) {
  return (
    <li className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">
          <span className="mr-2 text-brand-600 dark:text-indigo-300">{no}.</span>
          {ask}
        </p>
        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
      </div>

      <ul className="space-y-2">
        {senses.map((s) => (
          <li key={s.sense._id}>
            <QuizSenseCard sense={s.sense} hide={s.hide} />
          </li>
        ))}
      </ul>

      {answerOptions.length > 0 ? (
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {answerOptions.map((o, i) => (
            <li
              key={i}
              className={`rounded-md border px-3 py-1.5 ${
                o === answer
                  ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {i + 1}. {o}
              {o === answer && <span className="ml-2 text-xs">(정답)</span>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm">
          <span className="text-neutral-500">주관식 정답:</span> {answer}
        </p>
      )}
    </li>
  )
}
