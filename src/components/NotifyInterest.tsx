import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { useTagsByIds } from '@/hooks/useTagsByIds.ts'
import { InfoRow } from './InfoRow'
import { NotificationToggle } from './NotificationToggle'

/** 개인설정 > 내 관심 탭. notifySettingByUser 결과를 표시한다. */
export function NotifyInterest() {
  const { data, loading, error } = useQuery(NOTIFY_SETTING_BY_USER_QUERY, {
    fetchPolicy: 'cache-and-network',
  })

  const res = data?.NotifyQuery.notifySettingByUser
  const item = res?.item
  const sense = item?.senseSetting
  const focusOn = sense?.focusOn ?? []

  // focusOn 은 태그 id 목록이므로 이름을 조회해 표시한다. 못 찾으면 id 그대로.
  const { names: tagNames } = useTagsByIds(focusOn)

  const [minLv, maxLv] = sense?.lvs ?? [1, 5]
  // 서버가 저장 순서대로 주므로 시간순으로 정렬해 보여준다. ("HH:mm" 이라 문자열 정렬로 충분)
  const notiTimes = [...(sense?.notiTimes ?? [])].sort()

  return (
    <div className="space-y-4">
      {loading && !item && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res?.success === 4 && <p className="text-neutral-500">아직 설정된 관심이 없습니다.</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success === 1 && item && sense && (
        <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <InfoRow label="관심 태그">
            {focusOn.length === 0 ? (
              <span className="text-neutral-500">(없음)</span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {focusOn.map((id) => {
                  const name = tagNames.get(id)
                  return (
                    <li key={id}>
                      {name ? (
                        <Link
                          to={`/sense/tag/${encodeURIComponent(name)}`}
                          className="text-sm rounded-full px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 dark:hover:bg-neutral-700 hover:text-brand-700 dark:hover:text-brand-500 no-underline transition-colors"
                        >
                          #{name}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-neutral-500">{id}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </InfoRow>
          <InfoRow label="알림 시간">
            {notiTimes.length > 0 ? notiTimes.join(', ') : '(없음)'}
            <span className="ml-2 text-sm text-neutral-500">(UTC{item.fromUtcH} 기준)</span>
          </InfoRow>
          <InfoRow label="1회 받을 수">{sense.cntEach ?? 1}개</InfoRow>
          <InfoRow label="수준">
            Lv.{minLv} ~ Lv.{maxLv}
          </InfoRow>
          <InfoRow label="상태">{item.status}</InfoRow>
        </dl>
      )}

      <NotificationToggle />
    </div>
  )
}
