import { useAuth } from '@/auth/AuthProvider.tsx'
import { useMyArchive } from '@/hooks/useMyArchive.ts'
import { getSharedConfigs } from '@/lib/sharedConfigs.ts'
import {
  achievementTitleById,
  appliedNamesOf,
  readAchievementItemConfigs,
} from '@/lib/achievement.ts'

/** 칭호를 그리는 데 필요한 user.archive 의 일부 */
export type TitleArchive = {
  achievements?: { applied: { sortKey: number; name: string }[] } | null
} | null

/**
 * 닉네임 옆 칭호 (기본은 1순위만, all 이면 우선순위대로 모두). 걸어 둔 칭호가 없으면 아무것도 그리지 않는다.
 * userId 가 나면 서버 응답 대신 로컬의 내 archive(auth_archive)를 써서, 칭호를 바꾸면 바로 바뀐다.
 */
export function UserTitleBadge({
  archive: given,
  userId,
  all = false,
  className = '',
}: {
  archive?: TitleArchive
  userId?: string | null
  /** 1순위만이 아니라 모두 */
  all?: boolean
  className?: string
}) {
  const { user } = useAuth()
  const mine = useMyArchive()
  const archive = userId && userId === user?.userId && mine ? mine : given
  const names = appliedNamesOf(archive?.achievements).slice(0, all ? undefined : 1)
  const configs = readAchievementItemConfigs(getSharedConfigs())
  const titles = names.map((n) => achievementTitleById(n, configs)).filter((t) => t !== null)
  if (titles.length === 0) return null

  const badge =
    'shrink-0 truncate rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-medium leading-4 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
  if (!all) {
    return (
      <span title={`칭호: ${titles[0]}`} className={`${badge} ${className}`}>
        <span className="sr-only">칭호 </span>
        {titles[0]}
      </span>
    )
  }
  return (
    <ol aria-label="칭호" className={`flex flex-wrap items-center gap-1 ${className}`}>
      {titles.map((t) => (
        <li key={t} className={badge}>
          {t}
        </li>
      ))}
    </ol>
  )
}
