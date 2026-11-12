import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyAchievements } from '@/hooks/useMyAchievements.ts'
import { useAchievementApplySet } from '@/actions/achievementApply.ts'
import { ACHIEVEMENT_APPLY_LIMIT, ACHIEVEMENTS_PATH } from '@/lib/achievement.ts'
import { TitleDragBoard } from '@/components/TitleDragBoard.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/**
 * 개인설정 > 칭호. 획득한 칭호를 끌어 위(적용)에 놓으면 그 순위로 적용, 위에서 아래로 끌면 해제, 위에서 끌면 순서 변경.
 * 바뀔 때마다 바로 저장(archiveAchievementApplySet)하고, 실패하면 원래대로 되돌린다.
 */
export function AchievementTitleSettings() {
  const { configs, configsLoading, achievedById, appliedNames } = useMyAchievements()
  const { save, saving, message } = useAchievementApplySet()
  // 저장하는 동안 보여 줄 새 칭호 순서. 실패하면 버려서 원래대로 돌아간다.
  const [pending, setPending] = useState<string[] | null>(null)

  if (!configs) {
    if (configsLoading) return <LoadingSpinner />
    return <p className="text-sm text-red-600">도전과제 정보를 불러오지 못했습니다.</p>
  }

  if (achievedById.size === 0) {
    return (
      <p className="text-sm text-neutral-500">
        아직 획득한 칭호가 없어요.{' '}
        <Link to={ACHIEVEMENTS_PATH} className="text-brand-600 dark:text-indigo-300">
          도전과제 보러 가기
        </Link>
      </p>
    )
  }

  const change = async (next: string[]) => {
    setPending(next)
    await save(next)
    setPending(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">
        획득한 칭호를 위로 끌어 놓으면 그 순위로 적용되고, 아래로 끌어 놓으면 해제돼요. 위가 먼저
        보여요.
      </p>
      <TitleDragBoard
        applied={pending ?? appliedNames}
        achievedById={achievedById}
        limit={ACHIEVEMENT_APPLY_LIMIT}
        disabled={saving}
        onChange={(next) => void change(next)}
      />
      {saving && <p className="text-sm text-neutral-500">저장 중…</p>}
      {message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {message} 원래대로 되돌렸습니다.
        </p>
      )}
    </div>
  )
}
