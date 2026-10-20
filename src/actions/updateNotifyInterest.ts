import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { NOTIFY_SETTING_UPDATE_MUTATION } from '@/graphql/mutations/notify.ts'
import type { NotifySettingByUserQuery } from '@/graphql/__generated__/graphql.ts'
import type { TagOption } from '@/components/TagPicker.tsx'
import { LV_MAX, LV_MIN, type LevelRange } from '@/components/LevelRangeField.tsx'

export type NotifyInterestDraft = {
  tags: TagOption[]
  /** 'HH' (00~23). 서버엔 'HH:00' 으로 보낸다. */
  notiHour: string
  lvs: LevelRange
}

type Original = NotifySettingByUserQuery['NotifyQuery']['notifySettingByUser']['item']

const HH = /^([01]\d|2[0-3])$/

export function useUpdateNotifyInterest() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: saving }] = useMutation(NOTIFY_SETTING_UPDATE_MUTATION, {
    refetchQueries: [NOTIFY_SETTING_BY_USER_QUERY],
    awaitRefetchQueries: true,
  })

  const submit = async (original: Original | null, draft: NotifyInterestDraft): Promise<void> => {
    setError(null)

    if (!original) {
      setError('기존 설정을 불러오지 못했습니다.')
      return
    }

    if (!HH.test(draft.notiHour)) {
      setError('알림 시간을 선택하세요.')
      return
    }

    const [minLv, maxLv] = draft.lvs
    if (minLv < LV_MIN || maxLv > LV_MAX || minLv > maxLv) {
      setError(`수준은 Lv.${LV_MIN} ~ Lv.${LV_MAX} 사이에서 최소 ≤ 최고가 되도록 선택하세요.`)
      return
    }

    const { senseSetting } = original
    try {
      const { data, errors } = await mutate({
        variables: {
          input: {
            // 서버가 notiTimes 를 fromUtcH 기준으로 변환하므로 함께 보낸다.
            fromUtcH: original.fromUtcH,
            // senseSetting 은 nullish 필드를 삭제로 인식하므로 수정하지 않는 값도 채워 보낸다.
            senseSetting: {
              cntEach: senseSetting.cntEach ?? 1,
              lvs: [minLv, maxLv],
              focusOn: draft.tags.map((t) => t._id),
              notiTimes: [`${draft.notiHour}:00`],
            },
          },
        },
      })
      if (errors?.length) {
        setError(errors.map((e) => e.message).join(', '))
        return
      }
      const result = data?.NotifyMutation.notifySettingUpdate
      if (!result || !result.success) {
        setError(result?.message ?? '서버가 실패를 반환했습니다.')
        return
      }

      navigate('/user/settings?tab=interest', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return { submit, saving, error }
}
