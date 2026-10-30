import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Popover } from '@/components/Popover.tsx'
import { boardPath, listBoards } from '@/lib/boards.ts'
import { NOTICE_PATH, NOTICE_TITLE } from '@/lib/notice.ts'

/** 네비게이션의 Board 드롭다운. 맨 위는 공지사항, 그 아래 게시판은 공용 설정(sharedConfigs.boards)에서 읽는다. */
export function BoardMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // 열 때마다 읽어서 공용 설정이 갱신돼도 반영되게 한다.
  const boards = open ? listBoards() : []
  const items = [
    { key: 'notice', to: NOTICE_PATH, label: NOTICE_TITLE },
    ...boards.map((b) => ({ key: b._id, to: boardPath(b), label: b.label || b.title })),
  ]

  return (
    <Popover
      label={
        <>
          Board <span aria-hidden>▾</span>
        </>
      }
      title="게시판 선택"
      open={open}
      onOpenChange={setOpen}
      align="left"
      buttonClassName="nav-link"
    >
      <ul className="min-w-36">
        {items.map(({ key, to, label }) => (
          <li key={key}>
            <Link
              to={to}
              aria-current={pathname === to ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-2 text-sm no-underline hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                pathname === to
                  ? 'text-brand-600 dark:text-indigo-300 font-medium'
                  : 'text-neutral-800 dark:text-neutral-100'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </Popover>
  )
}
