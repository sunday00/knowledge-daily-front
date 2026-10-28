import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { ThemeToggle } from '@/theme/ThemeToggle.tsx'
import { UserMenu } from './UserMenu'

export function Navigator() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
      <div className="flex gap-4">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/tags" className="nav-link">
          Tags
        </Link>
        {user && (
          <Link to="/sense/my-sense" className="nav-link">
            My Senses
          </Link>
        )}
        <Link to="/about" className="nav-link">
          About
        </Link>
        {!user && (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user && <UserMenu />}
      </div>
    </nav>
  )
}
