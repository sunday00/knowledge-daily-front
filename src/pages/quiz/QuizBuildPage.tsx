import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { QUIZ_ONE_QUERY } from '@/graphql/queries/quiz.ts'
import { useCompleteQuiz } from '@/actions/quiz.ts'
import {
  QUIZ_PATH,
  clearQuizDraft,
  readQuizDraft,
  writeQuizDraft,
  type QuizItemDraft,
} from '@/lib/quiz.ts'
import { QuizSteps } from '@/components/quiz/QuizSteps.tsx'
import { QuizItemEditor } from '@/components/quiz/QuizItemEditor.tsx'
import { QuizItemView } from '@/components/quiz/QuizItemView.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { TagChips } from '@/components/TagChips.tsx'

/** 열린 편집기: 새 문항이거나, 임시 저장한 문항 고치기 */
type Editing = { mode: 'new' } | { mode: 'edit'; key: string } | null

const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * /quiz/:id/build — 퀴즈 만들기 2단계: 문항.
 * 문항은 브라우저에 임시 저장해 두었다가, 퀴즈 세트 완료 때 한 번에(bulk) 만들고 퀴즈를 공개한다.
 */
export default function QuizBuildPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(QUIZ_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'network-only',
    skip: !user || !id,
  })
  const res = data?.QuizQuery.quizOne
  const quiz = res?.success ? res.item : null

  const [items, setItems] = useState<QuizItemDraft[]>(() => readQuizDraft(id))
  // 아직 임시 저장한 문항이 없으면 첫 문항 편집기를 바로 연다.
  const [editing, setEditing] = useState<Editing>(() => (items.length ? null : { mode: 'new' }))
  const { complete, saving, itemsCreated, error: completeError } = useCompleteQuiz(id)

  useEffect(() => writeQuizDraft(id, items), [id, items])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!quiz) return <p className="text-neutral-500">{res?.message ?? '퀴즈를 찾을 수 없습니다.'}</p>
  if (quiz.user?._id !== user.userId)
    return <p className="text-neutral-500">내 퀴즈만 만들 수 있습니다.</p>
  if (quiz.status !== 'DRAFT') return <p className="text-neutral-500">이미 완료된 퀴즈입니다.</p>

  // 문항이 서버에 들어간 뒤(공개만 실패)에는 고치면 서버와 달라지므로 막는다.
  const locked = saving || itemsCreated

  const save = (value: Omit<QuizItemDraft, 'key'>) => {
    if (editing?.mode === 'edit') {
      const key = editing.key
      setItems((prev) => prev.map((it) => (it.key === key ? { ...value, key } : it)))
    } else {
      setItems((prev) => [...prev, { ...value, key: newKey() }])
    }
    setEditing(null)
  }

  const remove = (key: string) => {
    if (!window.confirm('이 문항을 지울까요?')) return
    setItems((prev) => prev.filter((it) => it.key !== key))
  }

  const onComplete = async () => {
    if (!window.confirm(`문항 ${items.length}개로 퀴즈를 완료하고 공개할까요?`)) return
    if (await complete(items)) {
      clearQuizDraft(id)
      navigate(QUIZ_PATH, { replace: true })
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">내 퀴즈 만들기</h2>
      <QuizSteps current={2} />

      <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-4">
        <p className="font-semibold">{quiz.title}</p>
        {quiz.brief && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{quiz.brief}</p>
        )}
        {quiz.description && (
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
            {quiz.description}
          </p>
        )}
        <TagChips tags={quiz.tags} className="mt-2" />
      </div>

      {items.length > 0 && (
        <ol className="space-y-4">
          {items.map((item, i) =>
            editing?.mode === 'edit' && editing.key === item.key ? (
              <li key={item.key}>
                <QuizItemEditor
                  no={i + 1}
                  initial={item}
                  onSave={save}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <QuizItemView
                key={item.key}
                no={i + 1}
                ask={item.ask}
                answer={item.answer}
                answerOptions={item.answerOptions}
                senses={item.senses}
                actions={
                  <>
                    <button
                      type="button"
                      className="btn text-xs px-2 py-1"
                      disabled={locked || editing !== null}
                      onClick={() => setEditing({ mode: 'edit', key: item.key })}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn text-xs px-2 py-1"
                      disabled={locked || editing !== null}
                      onClick={() => remove(item.key)}
                    >
                      삭제
                    </button>
                  </>
                }
              />
            ),
          )}
        </ol>
      )}

      {editing?.mode === 'new' && (
        <QuizItemEditor
          no={items.length + 1}
          onSave={save}
          onCancel={items.length ? () => setEditing(null) : undefined}
        />
      )}

      {completeError && <p className="text-sm text-red-600 dark:text-red-400">{completeError}</p>}

      {/* 한 문제 이상 만든 다음부터: 다음 문제 만들기 + 퀴즈 세트 완료 */}
      {items.length > 0 && editing === null && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="btn"
            disabled={locked}
            onClick={() => setEditing({ mode: 'new' })}
          >
            {items.length + 1}번 문제 만들기
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onComplete()}
            className="btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            {saving ? '완료하는 중...' : '퀴즈 세트 완료'}
          </button>
        </div>
      )}
    </section>
  )
}
