import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Popover } from '@/components/Popover.tsx'
import { boardPath, listBoards } from '@/lib/boards.ts'

/** 네비게이션의 Board 드롭다운. 게시판은 공용 설정(sharedConfigs.boards)에서 읽는다. */
export function BoardMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // 열 때마다 읽어서 공용 설정이 갱신돼도 반영되게 한다.
  const boards = open ? listBoards() : []

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
      {boards.length === 0 ? (
        <p className="px-3 py-2 text-sm text-neutral-500">게시판이 없습니다.</p>
      ) : (
        <ul className="min-w-36">
          {boards.map((b) => {
            const to = boardPath(b)
            return (
              <li key={b._id}>
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
                  {b.label || b.title}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Popover>
  )
}
