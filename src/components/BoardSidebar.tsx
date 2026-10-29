import { TAG_ASIDE_CLASS, TAG_LIST_CLASS, TagNavLink } from '@/components/TagSidebar.tsx'
import { boardPath, listBoardGroups } from '@/lib/boards.ts'

/** 게시판 페이지 좌측: 대분류(게시판 / 문의·요청)별 게시판 목록 */
export function BoardSidebar({ activeId }: { activeId?: string }) {
  const groups = listBoardGroups()

  return (
    <aside className={`${TAG_ASIDE_CLASS} space-y-4`}>
      {groups.map((g) => (
        <nav key={g.key} aria-labelledby={`board-group-${g.key}`} className="space-y-2">
          <h2
            id={`board-group-${g.key}`}
            className="text-sm font-semibold text-neutral-500 dark:text-neutral-400"
          >
            {g.title}
          </h2>
          {g.boards.length === 0 ? (
            <p className="text-sm text-neutral-500">아직 없습니다.</p>
          ) : (
            <ul className={TAG_LIST_CLASS}>
              {g.boards.map((b) => (
                <li key={b._id}>
                  <TagNavLink
                    to={boardPath(b)}
                    label={b.label || b.title}
                    active={b._id === activeId}
                  />
                </li>
              ))}
            </ul>
          )}
        </nav>
      ))}
    </aside>
  )
}
