import { QUIZ_MY_STATUS } from '@/lib/quiz.ts'

/** 내 풀이 상태 배지. 기록 없음·비로그인(null)이면 그리지 않는다. */
export function QuizMyStatusBadge({ status }: { status?: string | null }) {
  const s = status ? QUIZ_MY_STATUS[status] : undefined
  if (!s) return null
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${s.className}`}>{s.label}</span>
}
