import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import {
  ACHIEVEMENT_APPLY_LIMIT,
  HIDDEN_MARK,
  achievementGoalLabel,
  type AchievementItemView,
} from '@/lib/achievement.ts'
import { AchievementIcon } from '@/components/AchievementIcon.tsx'
import { useAchievementApply } from '@/actions/achievementApply.ts'
import { useAchievementPoint } from '@/actions/achievementPoint.ts'
import { useMyAchievements } from '@/hooks/useMyAchievements.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/** 개인설정 > 칭호 탭 (해제 / 순서 바꾸기는 여기서) */
const TITLE_SETTINGS_PATH = '/user/settings?tab=title'

/**
 * /user/achievements — 도전과제. 업적 설정(sharedConfigs)과 내 archive.achievements 를 비교해 보여 준다.
 * 여기선 칭호 추가만 한다. 해제와 순서 바꾸기는 개인설정 > 칭호.
 */
export default function AchievementsPage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Achievements />
}

function Achievements() {
  const { configs, configsLoading, hasAchievements, loading, error, items, appliedNames } =
    useMyAchievements()
  const apply = useAchievementApply()
  const point = useAchievementPoint()

  if (!configs) {
    if (configsLoading) return <LoadingSpinner />
    return <p className="text-sm text-red-600">도전과제 정보를 불러오지 못했습니다.</p>
  }

  const all = items.flatMap((i) => i.goals)
  const achievedCount = all.filter((g) => g.status === 'achieved').length
  const unclaimed = all.filter((g) => g.pointable && !point.claimed.has(g.id)).length
  const appliedCount = appliedNames.length

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">도전과제</h2>
        <p className="text-sm text-neutral-500">
          달성{' '}
          <span className="text-lg font-semibold tabular-nums text-brand-600 dark:text-indigo-300">
            {achievedCount}
          </span>{' '}
          / {all.length} · 칭호{' '}
          <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-300">
            {appliedCount}
          </span>{' '}
          / {ACHIEVEMENT_APPLY_LIMIT}
        </p>
      </div>

      {!hasAchievements && loading && <LoadingSpinner />}
      {error && !hasAchievements && (
        <p className="text-sm text-red-600">도전과제를 불러오지 못했습니다.</p>
      )}
      {apply.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {apply.message}
        </p>
      )}
      {point.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {point.message}
        </p>
      )}
      {unclaimed > 0 && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          받지 않은 보상이 {unclaimed}개 있어요. 달성한 도전과제의 <b>받기</b>를 눌러 주세요.
        </p>
      )}

      <p className="text-sm text-neutral-500">
        달성한 도전과제는 칭호로 걸 수 있어요. 해제와 순서 바꾸기는{' '}
        <Link to={TITLE_SETTINGS_PATH} className="text-brand-600 dark:text-indigo-300">
          개인설정 &gt; 칭호
        </Link>
        에서 해요.
      </p>

      {items.map((item) => (
        <ItemSection
          key={item.key}
          item={item}
          pendingId={apply.pendingId}
          onAdd={(id) => void apply.add(id)}
          point={point}
        />
      ))}
    </section>
  )
}

const ratioOf = (current: number, cnt: number) => (cnt > 0 ? Math.min(current / cnt, 1) : 0)

const STATUS_LABEL = { achieved: '달성', inProgress: '달성 중', locked: '잠김' } as const

const CARD_TONE = {
  applied: 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900',
  achieved: 'bg-brand-50/60 dark:bg-indigo-950/30',
  inProgress: 'bg-brand-100/70 dark:bg-indigo-900/40',
  locked: '',
} as const

function ItemSection({
  item,
  pendingId,
  onAdd,
  point,
}: {
  item: AchievementItemView
  /** 칭호로 거는 중인 도전과제 id */
  pendingId: string | null
  onAdd: (id: string) => void
  /** 보상 포인트 받기 */
  point: ReturnType<typeof useAchievementPoint>
}) {
  const done = item.goals.filter((g) => g.status === 'achieved').length
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 border-b border-neutral-200 pb-1 dark:border-neutral-800">
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-xs tabular-nums text-neutral-500">
          지금 {item.current.toLocaleString()} · {done}/{item.goals.length}
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {item.goals.map((goal) => {
          const achieved = goal.status === 'achieved'
          const applied = achieved && goal.applied
          // 아직 달성하지 못한 건 칭호와 개수를 숨기고, 진행 정도만 힌트로 보여 준다.
          const title = achieved ? goal.title : HIDDEN_MARK
          const label = achievementGoalLabel(item.key, achieved ? goal.cnt : null)
          const ratio = ratioOf(item.current, goal.cnt)
          return (
            <li
              key={goal.id}
              title={`${title} · ${label} · ${STATUS_LABEL[goal.status]}`}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 text-center ${
                CARD_TONE[applied ? 'applied' : goal.status]
              }`}
            >
              <AchievementIcon
                itemKey={item.key}
                status={goal.status}
                applied={applied}
                ratio={ratio}
              />
              <span
                className={`text-sm font-semibold leading-tight ${
                  goal.status === 'locked'
                    ? 'text-neutral-400 dark:text-neutral-600'
                    : applied
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {title}
              </span>
              <span
                className={`text-[11px] leading-tight ${
                  goal.status === 'locked'
                    ? 'text-neutral-400 dark:text-neutral-600'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {label}
              </span>
              {!achieved && (
                // 진행 힌트: 숫자 없이 막대만
                <span
                  role="progressbar"
                  aria-label="진행 정도"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(ratio * 100)}
                  className={`h-1 w-4/5 overflow-hidden rounded-full ${
                    goal.status === 'locked'
                      ? 'bg-neutral-200 dark:bg-neutral-800'
                      : 'bg-brand-200 dark:bg-indigo-900'
                  }`}
                >
                  <span
                    className={`block h-full rounded-full ${
                      goal.status === 'locked'
                        ? 'bg-neutral-400 dark:bg-neutral-600'
                        : 'bg-brand-600 dark:bg-indigo-300'
                    }`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </span>
              )}
              {goal.pointable && point.claimed.has(goal.id) ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  +{goal.reward.toLocaleString()}P 지급 예정
                </span>
              ) : goal.pointable ? (
                // 달성했지만 보상을 아직 안 받음
                <button
                  type="button"
                  disabled={point.pendingId !== null}
                  onClick={() => void point.claim(goal.id)}
                  className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {point.pendingId === goal.id
                    ? '받는 중…'
                    : `+${goal.reward.toLocaleString()}P 받기`}
                </button>
              ) : (
                <span
                  className={`text-[11px] tabular-nums ${
                    applied
                      ? 'font-medium text-amber-700 dark:text-amber-300'
                      : goal.status === 'locked'
                        ? 'text-neutral-400 dark:text-neutral-600'
                        : 'font-medium text-brand-700 dark:text-indigo-300'
                  }`}
                >
                  <span className="sr-only">{STATUS_LABEL[goal.status]} · </span>
                  {goal.reward.toLocaleString()}P
                </span>
              )}
              {applied ? (
                <span className="mt-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-medium text-white">
                  적용 중
                </span>
              ) : (
                achieved && (
                  // 개수가 넘치면 서버가 알려 주는 에러만 보여 준다 (해제는 개인설정에서)
                  <button
                    type="button"
                    disabled={pendingId !== null}
                    onClick={() => onAdd(goal.id)}
                    className="mt-0.5 rounded-full border border-brand-300 px-2 py-0.5 text-[11px] font-medium text-brand-600 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                  >
                    {pendingId === goal.id ? '…' : '칭호적용'}
                  </button>
                )
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
