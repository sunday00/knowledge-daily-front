import { AchievementIcon } from '@/components/AchievementIcon.tsx'
import { achievementGoalLabel } from '@/lib/achievement.ts'
import type { AchievementTitleOption } from '@/hooks/useMyAchievements.ts'

/** 적용한 칭호 한 줄 (아이콘, 칭호, 조건) */
export function AppliedTitleRow({
  name,
  option,
}: {
  name: string
  option: AchievementTitleOption | undefined
}) {
  return (
    <div className="flex items-center gap-2">
      {option && <AchievementIcon itemKey={option.itemKey} status="achieved" applied size={28} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-amber-700 dark:text-amber-300">
          {option?.title ?? name}
        </p>
        {option && (
          <p className="truncate text-[11px] text-neutral-500">
            {achievementGoalLabel(option.itemKey, option.cnt)}
          </p>
        )}
      </div>
    </div>
  )
}
