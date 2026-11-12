import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { useMyArchive } from '@/hooks/useMyArchive.ts'
import { syncArchiveAchievements } from '@/lib/authStorage.ts'
import { getSharedConfigs, refreshSharedConfigs } from '@/lib/sharedConfigs.ts'
import { useUserPointInc } from '@/lib/userPoint.ts'
import {
  ACHIEVEMENT_APPLY_LIMIT,
  HIDDEN_MARK,
  achievementGoalLabel,
  buildAchievementItems,
  readAchievementItemConfigs,
  type AchievementItemView,
} from '@/lib/achievement.ts'
import { AchievementIcon } from '@/components/AchievementIcon.tsx'
import { useAchievementApply } from '@/actions/achievementApply.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/** 업적 설정. 로컬 공용 설정에 없으면(이 기능 전에 받은 설정) 한 번 다시 받는다. */
function useAchievementItemConfigs() {
  const [configs, setConfigs] = useState(() => readAchievementItemConfigs(getSharedConfigs()))
  const [loading, setLoading] = useState(configs === null)
  useEffect(() => {
    if (configs) return
    let alive = true
    void refreshSharedConfigs().then((next) => {
      if (!alive) return
      setConfigs(readAchievementItemConfigs(next))
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [configs])
  return { configs, loading }
}

/** /user/achievements — 도전과제. 업적 설정(sharedConfigs)과 내 archive.achievements 를 비교해 보여 준다. */
export default function AchievementsPage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Achievements />
}

function Achievements() {
  const { configs, loading: configsLoading } = useAchievementItemConfigs()
  const myArchive = useMyArchive()
  const pointInc = useUserPointInc()
  const apply = useAchievementApply()
  // 로컬(auth_archive)은 로그인 시점 값이라, 들어올 때마다 서버 값으로 맞춘다.
  const { data, loading, error } = useQuery(ARCHIVE_MY_QUERY, { fetchPolicy: 'cache-and-network' })
  const serverItem = data?.ArchiveQuery.archiveUserOne.item
  useEffect(() => {
    if (serverItem)
      syncArchiveAchievements({ point: serverItem.point, achievements: serverItem.achievements })
  }, [serverItem])

  // 저장된 archive 가 없으면(이 기능 전에 로그인) 서버 값을 바로 쓴다.
  const achievements = myArchive?.achievements ?? serverItem?.achievements
  const inc = Math.max(pointInc ?? 0, myArchive?.point?.inc ?? 0, serverItem?.point.inc ?? 0)

  const items = useMemo(
    () => (configs ? buildAchievementItems(configs, achievements, { earnPoints: inc }) : []),
    [configs, achievements, inc],
  )

  if (!configs) {
    if (configsLoading) return <LoadingSpinner />
    return <p className="text-sm text-red-600">도전과제 정보를 불러오지 못했습니다.</p>
  }

  const all = items.flatMap((i) => i.goals)
  const achievedCount = all.filter((g) => g.status === 'achieved').length
  const appliedCount = all.filter((g) => g.status === 'achieved' && g.applied).length

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

      {!achievements && loading && <LoadingSpinner />}
      {error && !achievements && (
        <p className="text-sm text-red-600">도전과제를 불러오지 못했습니다.</p>
      )}
      {apply.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {apply.message}
        </p>
      )}

      {items.map((item) => (
        <ItemSection
          key={item.key}
          item={item}
          applyFull={appliedCount >= ACHIEVEMENT_APPLY_LIMIT}
          pendingId={apply.pendingId}
          onToggleApply={(id) => void apply.toggle(id)}
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
  applyFull,
  pendingId,
  onToggleApply,
}: {
  item: AchievementItemView
  /** 칭호를 더 적용할 수 없는지 (최대 개수) */
  applyFull: boolean
  /** 적용 / 해제 중인 도전과제 id */
  pendingId: string | null
  onToggleApply: (id: string) => void
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
              {goal.status === 'achieved' && (
                <button
                  type="button"
                  disabled={pendingId !== null || (!applied && applyFull)}
                  title={
                    !applied && applyFull
                      ? `칭호는 ${ACHIEVEMENT_APPLY_LIMIT}개까지 적용할 수 있습니다.`
                      : undefined
                  }
                  aria-pressed={applied}
                  onClick={() => onToggleApply(goal.id)}
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    applied
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'border border-brand-300 text-brand-600 hover:bg-brand-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  {pendingId === goal.id ? '…' : applied ? '적용 해제' : '칭호적용'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
