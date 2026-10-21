import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { useTagsByIds } from '@/hooks/useTagsByIds.ts'
import type { TagOption } from '@/components/TagPicker.tsx'
import { LV_MAX, LV_MIN, type LevelRange } from '@/components/LevelRangeField.tsx'

export function useNotifyInterestForm() {
  const { data, loading } = useQuery(NOTIFY_SETTING_BY_USER_QUERY, { fetchPolicy: 'cache-first' })
  const item = data?.NotifyQuery.notifySettingByUser.item
  const focusOn = item?.senseSetting.focusOn ?? []
  const { names, loading: tagsLoading } = useTagsByIds(focusOn)

  const [tags, setTags] = useState<TagOption[]>([])
  const [notiHour, setNotiHour] = useState('')
  const [lvs, setLvs] = useState<LevelRange>([LV_MIN, LV_MAX])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!item || tagsLoading || initialized) return
    setTags(item.senseSetting.focusOn.map((id) => ({ _id: id, name: names.get(id) ?? id })))
    // 'HH:mm' 중 시만 사용
    setNotiHour([...item.senseSetting.notiTimes].sort()[0]?.slice(0, 2) ?? '')
    const [minLv = LV_MIN, maxLv = LV_MAX] = item.senseSetting.lvs ?? []
    setLvs([minLv, maxLv])
    setInitialized(true)
  }, [item, names, tagsLoading, initialized])

  return {
    // 저장 시 수정하지 않는 필드(cntEach, fromUtcH)도 함께 보내야 하므로 원본을 넘긴다.
    original: item ?? null,
    tags,
    setTags,
    notiHour,
    setNotiHour,
    lvs,
    setLvs,
    loading: !initialized && (loading || tagsLoading),
  }
}
