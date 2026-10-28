import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { TAG_STANDARD_LIST_QUERY } from '@/graphql/queries/tag.ts'
import { useInterestTag } from '@/actions/updateNotifyInterest.ts'

/**
 * 태그 이름 옆 관심 태그 버튼. 로그인 사용자에게만 보인다.
 * removable 이면 이미 관심 태그일 때 "제외" 버튼을 보여준다. (제외한 뒤에는 다시 추가 버튼으로 되돌릴 수 있다.)
 */
export function InterestTagButton({
  tag,
  removable = false,
}: {
  tag: string
  removable?: boolean
}) {
  const { user } = useAuth()
  const { data: settingData } = useQuery(NOTIFY_SETTING_BY_USER_QUERY, {
    fetchPolicy: 'cache-first',
    skip: !user,
  })
  // 관심 태그는 id 로 저장하므로 이름으로 태그 id 를 찾는다.
  const { data: tagData } = useQuery(TAG_STANDARD_LIST_QUERY, {
    variables: { input: { size: 1, search: { name: { eq: tag } } } },
    fetchPolicy: 'cache-first',
    skip: !user,
  })
  const { add, remove, saving, error } = useInterestTag()

  const setting = settingData?.NotifyQuery.notifySettingByUser.item
  const tagId = tagData?.TagQuery.tagStandardList.items[0]?._id
  if (!user || !setting || !tagId) return null

  const added = setting.senseSetting.focusOn.includes(tagId)

  return (
    <span className="inline-flex items-center gap-2">
      {added && removable ? (
        <button
          type="button"
          className="btn text-xs px-2.5 py-1"
          onClick={() => void remove(setting, tagId)}
          disabled={saving}
        >
          {saving ? '제외 중...' : '− 내 관심에서 제외'}
        </button>
      ) : added ? (
        <span className="text-xs rounded-full px-2.5 py-1 bg-brand-50 dark:bg-neutral-800 text-brand-700 dark:text-indigo-300">
          ✓ 내 관심분야
        </span>
      ) : (
        <button
          type="button"
          className="btn text-xs px-2.5 py-1"
          onClick={() => void add(setting, tagId)}
          disabled={saving}
        >
          {saving ? '추가 중...' : '+ 내 관심분야 추가'}
        </button>
      )}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  )
}
