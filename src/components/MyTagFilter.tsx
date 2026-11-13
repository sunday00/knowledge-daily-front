import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { useTagsByIds } from '@/hooks/useTagsByIds.ts'
import { TAG_ADD_LINK_CLASS, TagNavLink } from '@/components/TagSidebar.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/** 내 관심 태그(알림 focusOn) 가로 줄. 누르면 내 상식을 그 태그로 거른다. pathOf(이름 없음) = 전체 */
export function MyTagFilter({
  active,
  pathOf,
}: {
  active?: string
  pathOf: (name?: string) => string
}) {
  const { data, loading, error } = useQuery(NOTIFY_SETTING_BY_USER_QUERY, {
    fetchPolicy: 'cache-first',
  })
  const focusOn = data?.NotifyQuery.notifySettingByUser.item?.senseSetting?.focusOn ?? []
  // focusOn 은 태그 id 목록이므로 이름을 조회한다. 이름을 못 찾은 태그는 링크를 만들 수 없어 뺀다.
  const { names, loading: namesLoading } = useTagsByIds(focusOn)
  const tags = focusOn.flatMap((id) => {
    const name = names.get(id)
    return name ? [{ _id: id, name }] : []
  })

  if ((loading && !data) || namesLoading) return <LoadingSpinner size="sm" />
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">관심 태그 조회 실패</p>

  return (
    <nav aria-label="내 관심 태그" className="flex flex-wrap items-center gap-1.5">
      {tags.length > 0 && (
        <>
          <TagNavLink to={pathOf()} label="전체" active={!active} />
          {tags.map((t) => (
            <TagNavLink
              key={t._id}
              to={pathOf(t.name)}
              label={`#${t.name}`}
              active={t.name === active}
            />
          ))}
        </>
      )}
      <Link
        to="/user/settings/interest/edit"
        className={TAG_ADD_LINK_CLASS}
        title="내 관심 태그 수정"
      >
        ＋ 태그 추가
      </Link>
    </nav>
  )
}
