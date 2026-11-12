import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useSignOut } from '@/actions/signOut.ts'
import { UserAvatar } from '@/components/profile/UserAvatar.tsx'
import { useMyArchive } from '@/hooks/useMyArchive.ts'
import { PROMOTION_PATH } from '@/lib/promotion.ts'
import { MY_MEDIA_PATH } from '@/lib/myMedia.ts'
import { ACHIEVEMENTS_PATH } from '@/lib/achievement.ts'

export function UserMenu() {
  const { user } = useAuth()
  const myArchive = useMyArchive()
  const signOut = useSignOut()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!user) return null

  const label = user.nickname.length > 12 ? `${user.nickname.slice(0, 10)}…` : user.nickname

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="btn"
        aria-haspopup="menu"
        aria-expanded={open}
        // 좁은 화면에선 닉네임을 숨기므로 툴팁/스크린리더로 알린다.
        title={user.nickname}
        aria-label={`${user.nickname} 메뉴`}
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar archive={myArchive} size={20} />
        <span className="hidden sm:inline">{label}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg py-1 z-10"
        >
          <Link
            to="/user/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline"
          >
            개인설정
          </Link>
          <Link
            to={ACHIEVEMENTS_PATH}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline"
          >
            도전과제
          </Link>
          <Link
            to={MY_MEDIA_PATH}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline"
          >
            내 미디어 관리
          </Link>
          <Link
            to={PROMOTION_PATH}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline"
          >
            프로모션
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="block w-full text-left px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
