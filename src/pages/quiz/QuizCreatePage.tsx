import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useCreateQuiz, type QuizSetDraft } from '@/actions/quiz.ts'
import { QUIZ_PATH, quizBuildPath } from '@/lib/quiz.ts'
import { QuizSteps } from '@/components/quiz/QuizSteps.tsx'
import { QuizSetForm } from '@/components/quiz/QuizSetForm.tsx'

/** /quiz/new — 퀴즈 만들기 1단계: 퀴즈 세트 (제목, 소제목, 소개글, 태그) */
export default function QuizCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { submit, saving, error } = useCreateQuiz()

  if (!user) return <Navigate to="/login" replace />

  const onSubmit = async (draft: QuizSetDraft) => {
    const id = await submit(draft)
    // 뒤로 가기로 1단계에 돌아와 같은 퀴즈를 또 만들지 않게 replace
    if (id) navigate(quizBuildPath(id), { replace: true })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">내 퀴즈 만들기</h2>
      <QuizSteps current={1} />
      <QuizSetForm
        onSubmit={onSubmit}
        saving={saving}
        error={error}
        submitLabel="다음: 문항 만들기"
        savingLabel="만드는 중..."
        cancelTo={QUIZ_PATH}
      />
    </section>
  )
}
