import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { ThemeToggle } from '@/theme/ThemeToggle.tsx'
import { documentPath } from '@/lib/documents.ts'
import { boardPath, listBoards } from '@/lib/boards.ts'
import { NOTICE_PATH, NOTICE_TITLE } from '@/lib/notice.ts'
import { CAMPAIGN_PATH } from '@/lib/campaign.ts'
import { QUIZ_PATH } from '@/lib/quiz.ts'
import { UserMenu } from './UserMenu'
import { BoardMenu } from './BoardMenu'
import { UserPoint } from './UserPoint'
import { Popover } from './Popover'

// 홈은 사이트 제목(로고)을 누르면 가므로 메뉴에 따로 두지 않는다.
const ABOUT_PATH = documentPath('about')

export function Navigator() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
      {/* 좁은 화면: 햄버거 버튼 하나로 */}
      <div className="sm:hidden">
        <MobileMenu />
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <Link to="/tags" className="nav-link">
          Senses
        </Link>
        <BoardMenu />
        <Link to={QUIZ_PATH} className="nav-link">
          Quiz
        </Link>
        <Link to={CAMPAIGN_PATH} className="nav-link">
          Event
        </Link>
        <Link to={ABOUT_PATH} className="nav-link">
          About
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <UserPoint />
        <ThemeToggle />
        {user ? (
          <UserMenu />
        ) : (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

type MenuItem = { key: string; to: string; label: string }

/** 좁은 화면의 메뉴. 게시판 드롭다운은 펼쳐서 같은 목록 안에 보인다. */
function MobileMenu() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  // 이동하면 닫는다. (뒤로 가기 등 메뉴 밖에서 바뀐 경우도)
  useEffect(() => setOpen(false), [pathname])

  // 열 때마다 읽어서 공용 설정이 갱신돼도 반영되게 한다.
  const boards = open ? listBoards() : []
  const main: MenuItem[] = [{ key: 'tags', to: '/tags', label: 'Senses' }]
  const boardItems: MenuItem[] = [
    { key: 'notice', to: NOTICE_PATH, label: NOTICE_TITLE },
    ...boards.map((b) => ({ key: b._id, to: boardPath(b), label: b.label || b.title })),
  ]

  const renderItem = ({ key, to, label }: MenuItem) => (
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
  )

  return (
    <Popover
      label={open ? <CloseIcon /> : <MenuIcon />}
      title="메뉴"
      open={open}
      onOpenChange={setOpen}
      align="left"
      buttonClassName="nav-link flex items-center rounded-md p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <ul className="min-w-48">
        {main.map(renderItem)}
        <li
          aria-hidden
          className="mt-1 border-t border-neutral-200 dark:border-neutral-700 px-3 pb-1 pt-2 text-xs text-neutral-500"
        >
          Board
        </li>
        {boardItems.map(renderItem)}
        <li aria-hidden className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
        {renderItem({ key: 'quiz', to: QUIZ_PATH, label: 'Quiz' })}
        {renderItem({ key: 'event', to: CAMPAIGN_PATH, label: 'Event' })}
        {renderItem({ key: 'about', to: ABOUT_PATH, label: 'About' })}
      </ul>
    </Popover>
  )
}

function MenuIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
