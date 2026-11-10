import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { QUIZ_ONE_QUERY } from '@/graphql/queries/quiz.ts'
import { useSaveQuizItem, useUpdateQuiz, type QuizSetDraft } from '@/actions/quiz.ts'
import { useQuizSenses } from '@/hooks/useQuizSenses.ts'
import { quizBuildPath, quizPath, senseDraftsOf } from '@/lib/quiz.ts'
import { QuizSetForm } from '@/components/quiz/QuizSetForm.tsx'
import { QuizItemEditor } from '@/components/quiz/QuizItemEditor.tsx'
import { QuizItemView } from '@/components/quiz/QuizItemView.tsx'
import { TagChips } from '@/components/TagChips.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/** 열린 편집기: 퀴즈 세트, 새 문항, 기존 문항 고치기 */
type Editing = { mode: 'set' } | { mode: 'new' } | { mode: 'item'; id: string } | null

/**
 * /quiz/:id/edit — 공개된 내 퀴즈 수정.
 * 만들기와 달리 임시 저장 없이 저장할 때마다 바로 서버에 반영한다.
 * (문항 삭제 api 는 아직 없어 고치기·추가만)
 */
export default function QuizEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { data, loading, error } = useQuery(QUIZ_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    skip: !user || !id,
  })
  const res = data?.QuizQuery.quizOne
  const quiz = res?.success ? res.item : null
  const items = quiz?.quizItems ?? []
  const { senses, loading: sensesLoading } = useQuizSenses(items)

  const [editing, setEditing] = useState<Editing>(null)
  const setForm = useUpdateQuiz(id)
  const itemForm = useSaveQuizItem(id)

  if (!user) return <Navigate to="/login" replace />
  if (loading && !data) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!quiz) return <p className="text-neutral-500">{res?.message ?? '퀴즈를 찾을 수 없습니다.'}</p>
  if (quiz.user?._id !== user.userId)
    return <p className="text-neutral-500">내 퀴즈만 고칠 수 있습니다.</p>
  // 아직 공개 전이면 만들기 화면에서 이어서
  if (quiz.status === 'DRAFT') return <Navigate to={quizBuildPath(quiz._id)} replace />

  const busy = editing !== null || sensesLoading
  const nextSortKey = Math.max(0, ...items.map((it) => it.sortKey)) + 1

  const saveSet = async (draft: QuizSetDraft) => {
    if (await setForm.submit(draft)) setEditing(null)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">내 퀴즈 수정</h2>
        <Link to={quizPath(quiz._id)} className="btn text-sm no-underline">
          풀어 보기
        </Link>
      </div>

      {editing?.mode === 'set' ? (
        <div className="rounded-lg border border-brand-500/40 p-4">
          <QuizSetForm
            initial={{
              title: quiz.title,
              brief: quiz.brief ?? '',
              description: quiz.description ?? '',
              tagNames: quiz.tags.map((t) => t.name),
            }}
            onSubmit={saveSet}
            saving={setForm.saving}
            error={setForm.error}
            submitLabel="저장"
            savingLabel="저장 중..."
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{quiz.title}</p>
              {quiz.brief && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{quiz.brief}</p>
              )}
            </div>
            <button
              type="button"
              className="btn shrink-0 text-xs px-2 py-1"
              disabled={busy}
              onClick={() => setEditing({ mode: 'set' })}
            >
              세트 수정
            </button>
          </div>
          {quiz.description && (
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
              {quiz.description}
            </p>
          )}
          <TagChips tags={quiz.tags} className="mt-2" />
        </div>
      )}

      {sensesLoading && <LoadingSpinner size="sm" />}

      <ol className="space-y-4">
        {items.map((item, i) => {
          const cards = senseDraftsOf(item.senses, senses)
          return editing?.mode === 'item' && editing.id === item._id ? (
            <li key={item._id}>
              <QuizItemEditor
                no={i + 1}
                initial={{
                  senses: cards,
                  ask: item.ask,
                  answer: item.answer,
                  answerOptions: item.answerOptions,
                }}
                submitLabel="저장"
                saving={itemForm.saving}
                saveError={itemForm.error}
                onSave={async (value) => {
                  if (await itemForm.save(value, { itemId: item._id })) setEditing(null)
                }}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <QuizItemView
              key={item._id}
              no={i + 1}
              ask={item.ask}
              answer={item.answer}
              answerOptions={item.answerOptions}
              senses={cards}
              actions={
                <button
                  type="button"
                  className="btn text-xs px-2 py-1"
                  disabled={busy}
                  onClick={() => setEditing({ mode: 'item', id: item._id })}
                >
                  수정
                </button>
              }
            />
          )
        })}
      </ol>

      {editing?.mode === 'new' ? (
        <QuizItemEditor
          no={items.length + 1}
          submitLabel="추가"
          saving={itemForm.saving}
          saveError={itemForm.error}
          onSave={async (value) => {
            if (await itemForm.save(value, { sortKey: nextSortKey })) setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => setEditing({ mode: 'new' })}
          >
            {items.length + 1}번 문제 추가
          </button>
        </div>
      )}
    </section>
  )
}
