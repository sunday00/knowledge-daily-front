import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { useMyArchive } from '@/hooks/useMyArchive.ts'
import { syncArchiveAchievements } from '@/lib/authStorage.ts'
import { getSharedConfigs, refreshSharedConfigs } from '@/lib/sharedConfigs.ts'
import { useUserPointInc } from '@/lib/userPoint.ts'
import {
  appliedNamesOf,
  buildAchievementItems,
  readAchievementItemConfigs,
  type AchievementView,
} from '@/lib/achievement.ts'

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

/** 칭호 하나 (적용 / 고르기 화면용). itemKey 는 아이콘에 쓴다 */
export type AchievementTitleOption = AchievementView & { itemKey: string }

/**
 * 내 도전과제. 업적 설정(sharedConfigs)과 내 archive.achievements(auth_archive)를 비교한 결과.
 * 로컬은 로그인 시점 값이라 쓸 때마다 서버 값으로 맞춘다.
 */
export function useMyAchievements() {
  const { configs, loading: configsLoading } = useAchievementItemConfigs()
  const myArchive = useMyArchive()
  const pointInc = useUserPointInc()
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
  /** 달성한 칭호. id 로 찾는다 */
  const achievedById = useMemo(() => {
    const map = new Map<string, AchievementTitleOption>()
    for (const item of items)
      for (const g of item.goals)
        if (g.status === 'achieved') map.set(g.id, { ...g, itemKey: item.key })
    return map
  }, [items])
  /** 적용한 칭호 id, 우선순위 순 (설정에서 사라진 id 는 뺀다) */
  const appliedNames = useMemo(
    () => (configs ? appliedNamesOf(achievements).filter((n) => achievedById.has(n)) : []),
    [configs, achievements, achievedById],
  )

  return {
    configs,
    configsLoading,
    /** 서버 / 로컬 어디에서든 받은 적이 있는지 */
    hasAchievements: achievements != null,
    loading,
    error,
    items,
    achievedById,
    appliedNames,
  }
}
