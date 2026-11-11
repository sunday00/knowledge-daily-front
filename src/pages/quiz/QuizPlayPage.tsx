import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { QUIZ_ONE_QUERY } from '@/graphql/queries/quiz.ts'
import type { QuizOneQuery } from '@/graphql/__generated__/graphql.ts'
import { useQuizSenses } from '@/hooks/useQuizSenses.ts'
import { useSaveQuizAnswer } from '@/actions/quiz.ts'
import {
  QUIZ_PATH,
  isCorrectAnswer,
  quizBuildPath,
  quizEditPath,
  quizPath,
  senseDraftsOf,
  type QuizSenseCardData,
} from '@/lib/quiz.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { QuizSenseCard } from '@/components/quiz/QuizSenseCard.tsx'
import { QuizMyStatusBadge } from '@/components/quiz/QuizMyStatusBadge.tsx'
import { TagChips } from '@/components/TagChips.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'

type Quiz = QuizOneQuery['QuizQuery']['quizOne']['item']

/** 내 풀이 기록 (유저 + 퀴즈당 한 건, 늘 최고 기록 + 시도 횟수). 기록 없음·비로그인은 null */
type QuizBestAnswer = NonNullable<Quiz['me']>

const bestAnswerOf = (quiz: Quiz): QuizBestAnswer | null => quiz.me ?? null
type QuizItem = Quiz['quizItems'][number]

const primaryBtn =
  'btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700'

/**
 * /quiz/:id — 퀴즈 풀기.
 * 위에 퀴즈 정보를 작게 두고, 들어오자마자 1번 문제부터 푼다.
 * 한 문제씩 내면 바로 채점하고 가린 카드를 열어 준다 → 다 풀면 결과 + 풀이 기록 저장(로그인, 공개 퀴즈).
 * 정답은 응답에 함께 오지만 화면엔 채점 전까지 보이지 않는다.
 * 내 퀴즈면 수정 버튼이 보인다.
 */
export default function QuizPlayPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { data, loading, error } = useQuery(QUIZ_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
    skip: !id,
  })
  const res = data?.QuizQuery.quizOne
  const quiz = res?.success ? res.item : null
  const { senses, loading: sensesLoading } = useQuizSenses(quiz?.quizItems ?? [])

  // 푸는 문제 번호(0부터). 문항 수와 같으면 결과
  const [index, setIndex] = useState(0)
  // 문제별로 낸 답. 아직 안 냈으면 undefined
  const [answers, setAnswers] = useState<(string | undefined)[]>([])
  // 풀었던 적 있으면 처음엔 내 최고 기록 안내를 띄우고, 결과 보기 / 다시 풀기 중에 고르면 넘어간다.
  const [started, setStarted] = useState(false)
  // 지금 결과가 내 최고 기록을 불러온 것인지 (다시 저장하지 않는다)
  const [fromPast, setFromPast] = useState(false)
  const record = useSaveQuizAnswer(id)

  if (loading && !data) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!quiz) return <p className="text-neutral-500">{res?.message ?? '퀴즈를 찾을 수 없습니다.'}</p>

  const mine = !!user && quiz.user?._id === user.userId
  // 공개 전 퀴즈는 만든 사람만 본다.
  if (quiz.status !== 'ACTIVE' && !mine)
    return <p className="text-neutral-500">퀴즈를 찾을 수 없습니다.</p>

  const items = quiz.quizItems
  // 기록은 로그인했고 공개된 퀴즈일 때만 남긴다. (만드는 중인 내 퀴즈는 미리 풀어 보기)
  const recordable = !!user && quiz.status === 'ACTIVE'

  const next = () => {
    const to = index + 1
    setIndex(to)
    if (to === items.length && recordable) {
      void record.save(
        items.map((item, i) => ({
          quizItem: item._id,
          answer: answers[i] ?? '',
          correct: isCorrectAnswer(answers[i] ?? '', item.answer),
        })),
      )
    }
  }
  const retry = () => {
    setAnswers([])
    setIndex(0)
    setFromPast(false)
    setStarted(true)
  }

  const bestAnswer = recordable ? bestAnswerOf(quiz) : null
  // 최고 기록의 답을 지금 문항 순서로. 그 뒤로 바뀌었거나 새로 생긴 문항은 빈 답(오답)
  const showPast = () => {
    if (!bestAnswer) return
    const byItem = new Map(bestAnswer.answers.map((a) => [a.quizItem, a.answer]))
    setAnswers(items.map((item) => byItem.get(item._id) ?? ''))
    setIndex(items.length)
    setFromPast(true)
    setStarted(true)
  }

  return (
    <section className="space-y-5">
      <QuizHeader quiz={quiz} mine={mine} />

      {items.length === 0 ? (
        <p className="text-neutral-500">아직 문항이 없습니다.</p>
      ) : sensesLoading ? (
        <LoadingSpinner />
      ) : bestAnswer && !started ? (
        <PastSummary last={bestAnswer} total={items.length} onShow={showPast} onRetry={retry} />
      ) : index < items.length ? (
        <QuizQuestion
          // 문제가 바뀌면 입력 상태를 새로
          key={items[index]._id}
          no={index + 1}
          total={items.length}
          item={items[index]}
          senses={senses}
          given={answers[index]}
          onAnswer={(answer) =>
            setAnswers((prev) => {
              const copy = [...prev]
              copy[index] = answer
              return copy
            })
          }
          onNext={next}
        />
      ) : (
        <QuizResult
          items={items}
          answers={answers}
          onRetry={retry}
          record={
            fromPast && bestAnswer
              ? { kind: 'past', at: bestAnswer.createdAt }
              : !user
                ? { kind: 'guest' }
                : !recordable
                  ? { kind: 'none' }
                  : record.saving
                    ? { kind: 'saving' }
                    : record.error
                      ? { kind: 'error', message: record.error }
                      : record.best
                        ? { kind: 'saved', best: record.best, total: items.length }
                        : { kind: 'none' }
          }
          // 공개된 퀴즈만 반응·댓글 (만드는 중인 퀴즈 미리 풀기엔 없음)
          social={quiz.status === 'ACTIVE' ? quizTarget(quiz) : null}
        />
      )}
    </section>
  )
}

/** 풀었던 적 있는 퀴즈에 들어오면: 내 최고 기록 요약 + 결과 보기 / 다시 풀기 */
function PastSummary({
  last,
  total,
  onShow,
  onRetry,
}: {
  last: QuizBestAnswer
  total: number
  onShow: () => void
  onRetry: () => void
}) {
  return (
    <div className="space-y-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 p-6 text-center">
      <p className="text-sm text-neutral-500">이미 풀어 본 퀴즈입니다. 내 최고 기록</p>
      <p className="text-2xl font-bold tabular-nums">
        {last.correctCnt} <span className="text-base text-neutral-400">/ {total}</span>
      </p>
      <p className="text-xs text-neutral-500">
        {last.tryCnt.toLocaleString()}번 시도 · 최고 기록 {formatDateTime(last.createdAt)}
      </p>
      <div className="flex justify-center gap-2">
        <button type="button" className="btn" onClick={onShow}>
          결과 보기
        </button>
        <button type="button" className={primaryBtn} onClick={onRetry}>
          다시 풀기
        </button>
      </div>
    </div>
  )
}

/** 퀴즈에 대화록(댓글)을 달 때의 원글 */
const quizTarget = (quiz: { _id: string }): OpinionTarget => ({
  entity: 'Quiz',
  id: quiz._id,
  path: quizPath(quiz._id),
})

/** /quiz/:id/threads/:threadId — 퀴즈 정보(작게) + 한 대화(thread)의 의견 목록 */
export function QuizThreadPage() {
  const { id = '', threadId = '' } = useParams<{ id: string; threadId: string }>()
  const { user } = useAuth()
  const { data, loading, error } = useQuery(QUIZ_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
    skip: !id,
  })
  const res = data?.QuizQuery.quizOne
  const quiz = res?.success && res.item.status === 'ACTIVE' ? res.item : null

  if (loading && !data) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!quiz) return <p className="text-neutral-500">{res?.message ?? '퀴즈를 찾을 수 없습니다.'}</p>

  return (
    // pb-32: 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <section className="space-y-5 pb-32">
      <QuizHeader quiz={quiz} mine={!!user && quiz.user?._id === user.userId} />
      <div className="flex justify-end">
        <Link to={quizPath(quiz._id)} className={`${primaryBtn} text-sm no-underline`}>
          퀴즈 풀기
        </Link>
      </div>
      <ThreadConversation target={quizTarget(quiz)} threadId={threadId} />
    </section>
  )
}

/** 위에 작게: 제목, 소제목, 소개글, 태그, 내 풀이 상태, (내 퀴즈면) 수정 */
function QuizHeader({ quiz, mine }: { quiz: Quiz; mine: boolean }) {
  return (
    <header className="space-y-1 border-b border-neutral-200 dark:border-neutral-800 pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{quiz.title}</h2>
          <QuizMyStatusBadge status={quiz.me?.status} />
        </div>
        <div className="flex shrink-0 gap-1">
          {mine && (
            <Link
              to={quiz.status === 'DRAFT' ? quizBuildPath(quiz._id) : quizEditPath(quiz._id)}
              className="btn text-xs px-2 py-1 no-underline"
            >
              {quiz.status === 'DRAFT' ? '이어 만들기' : '수정'}
            </Link>
          )}
          <Link to={QUIZ_PATH} className="btn text-xs px-2 py-1 no-underline">
            목록
          </Link>
        </div>
      </div>
      {quiz.brief && <p className="text-sm text-neutral-600 dark:text-neutral-400">{quiz.brief}</p>}
      {quiz.description && (
        <p className="whitespace-pre-line text-xs text-neutral-500">{quiz.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TagChips tags={quiz.tags} />
        <p className="text-xs text-neutral-400">
          {quiz.user?.nickname && <span>{quiz.user.nickname} · </span>}
          {quiz.quizItemsCnt.toLocaleString()}문항 · {formatDateTime(quiz.createdAt)}
        </p>
      </div>
    </header>
  )
}

/** 섞은 사본 (Fisher–Yates). 원본은 그대로 둔다. */
function shuffle<T>(list: readonly T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** 한 문제. 답을 내면 바로 채점하고 가린 카드를 모두 연다. */
function QuizQuestion({
  no,
  total,
  item,
  senses,
  given,
  onAnswer,
  onNext,
}: {
  no: number
  total: number
  item: QuizItem
  senses: ReadonlyMap<string, QuizSenseCardData>
  given: string | undefined
  onAnswer: (answer: string) => void
  onNext: () => void
}) {
  const [value, setValue] = useState('')
  // 보기는 문제를 열 때마다 새로 섞어 보여 준다. 고른 값은 보기 글자 그대로라 채점·기록엔 영향 없다.
  const [options] = useState(() => shuffle(item.answerOptions))
  const graded = given !== undefined
  const correct = graded && isCorrectAnswer(given, item.answer)
  const choice = item.answerOptions.length > 0
  const cards = senseDraftsOf(item.senses, senses)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (graded || !value.trim()) return
    onAnswer(value.trim())
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-neutral-500">
        <span className="tabular-nums">
          {no} / {total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-brand-600 transition-all"
            style={{ width: `${((no - (graded ? 0 : 1)) / total) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-lg font-semibold">
        <span className="mr-2 text-brand-600 dark:text-indigo-300">Q{no}.</span>
        {item.ask}
      </p>

      <ul className="space-y-2">
        {cards.map((c) => (
          <li key={c.sense._id}>
            {/* 채점하면 가린 부분을 연다 */}
            <QuizSenseCard sense={c.sense} hide={graded ? [] : c.hide} />
          </li>
        ))}
      </ul>

      {choice ? (
        <ol className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => {
            const picked = (graded ? given : value) === o
            const isAnswer = graded && o === item.answer
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={graded}
                  aria-pressed={picked}
                  onClick={() => setValue(o)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    isAnswer
                      ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : graded && picked
                        ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : picked
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                          : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'
                  }`}
                >
                  {i + 1}. {o}
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <input
          value={graded ? given : value}
          onChange={(e) => setValue(e.target.value)}
          disabled={graded}
          placeholder="정답 입력"
          aria-label="정답 입력"
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
        />
      )}

      {graded && (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            correct
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {correct ? '정답입니다!' : `오답입니다. 정답: ${item.answer}`}
        </p>
      )}

      <div className="flex justify-end">
        {graded ? (
          <button type="button" className={primaryBtn} onClick={onNext}>
            {no < total ? '다음 문제' : '결과 보기'}
          </button>
        ) : (
          <button type="submit" className={primaryBtn} disabled={!value.trim()}>
            정답 확인
          </button>
        )}
      </div>
    </form>
  )
}

/** 풀이 기록 저장 상태 */
type RecordState =
  | { kind: 'past'; at: unknown }
  | { kind: 'guest' }
  | { kind: 'none' }
  | { kind: 'saving' }
  | { kind: 'saved'; best: { correctCnt: number; tryCnt: number }; total: number }
  | { kind: 'error'; message: string }

function QuizResult({
  items,
  answers,
  onRetry,
  record,
  social,
}: {
  items: QuizItem[]
  answers: (string | undefined)[]
  onRetry: () => void
  record: RecordState
  /** 반응·댓글을 달 원글. null 이면 두지 않는다 */
  social: OpinionTarget | null
}) {
  const results = items.map((item, i) => ({
    item,
    given: answers[i] ?? '',
    correct: isCorrectAnswer(answers[i] ?? '', item.answer),
  }))
  const score = results.filter((r) => r.correct).length

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 p-6 text-center">
        <p className="text-sm text-neutral-500">결과</p>
        <p className="text-3xl font-bold tabular-nums">
          {score} <span className="text-lg text-neutral-400">/ {items.length}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500" role="status">
          {record.kind === 'past'
            ? `내 최고 기록 · ${formatDateTime(record.at)}`
            : record.kind === 'guest'
              ? '로그인하면 풀이 기록이 남습니다.'
              : record.kind === 'saving'
                ? '기록 저장 중...'
                : record.kind === 'saved'
                  ? `기록 저장 · 내 최고 ${record.best.correctCnt} / ${record.total} · ${record.best.tryCnt}번째 시도`
                  : null}
        </p>
        {record.kind === 'error' && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            기록 저장 실패: {record.message}
          </p>
        )}
      </div>

      <ol className="space-y-2">
        {results.map(({ item, given, correct }, i) => (
          <li
            key={item._id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3 text-sm"
          >
            <p className="font-medium">
              <span
                aria-label={correct ? '정답' : '오답'}
                className={`mr-2 ${correct ? 'text-green-600' : 'text-red-600'}`}
              >
                {correct ? 'O' : 'X'}
              </span>
              {i + 1}. {item.ask}
            </p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              내 답: {given || '-'}
              {!correct && <span className="ml-3">정답: {item.answer}</span>}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex justify-end gap-2">
        <Link to={QUIZ_PATH} className="btn no-underline">
          목록
        </Link>
        <button type="button" className={primaryBtn} onClick={onRetry}>
          다시 풀기
        </button>
      </div>

      {social && (
        // pb-32: 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
        <div className="space-y-8 border-t border-neutral-200 dark:border-neutral-800 pt-4 pb-32">
          <ReactionBar target={{ entity: 'Quiz', id: social.id }} />
          <TargetThreads target={social} />
        </div>
      )}
    </div>
  )
}
