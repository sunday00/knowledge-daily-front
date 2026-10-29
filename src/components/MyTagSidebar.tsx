import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { NOTIFY_SETTING_BY_USER_QUERY } from '@/graphql/queries/notify.ts'
import { useTagsByIds } from '@/hooks/useTagsByIds.ts'
import {
  TAG_ADD_LINK_CLASS,
  TAG_ASIDE_CLASS,
  TAG_LIST_CLASS,
  TagNavLink,
} from '@/components/TagSidebar.tsx'

const myTagPath = (name?: string) =>
  name ? `/sense/my-sense?tag=${encodeURIComponent(name)}` : '/sense/my-sense'

/** 내 Knowledge 좌측: 알림 관심 태그(focusOn) 목록. 누르면 내 상식을 그 태그로 거른다. */
export function MyTagSidebar({ active }: { active?: string }) {
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

  return (
    <aside className={TAG_ASIDE_CLASS}>
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">내 관심 태그</h2>

      {(loading && !data) || namesLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">조회 실패</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-neutral-500">관심 태그가 없습니다.</p>
      ) : (
        <ul className={TAG_LIST_CLASS}>
          <li>
            <TagNavLink to={myTagPath()} label="전체" active={!active} />
          </li>
          {tags.map((t) => (
            <li key={t._id}>
              <TagNavLink to={myTagPath(t.name)} label={`#${t.name}`} active={t.name === active} />
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/user/settings/interest/edit"
        className={TAG_ADD_LINK_CLASS}
        title="내 관심 태그 수정"
      >
        ＋ 태그 추가
      </Link>
    </aside>
  )
}
