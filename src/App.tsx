import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage'
import { ThemeToggle } from './theme/ThemeToggle'

export default function App() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <nav className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex gap-4">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/login" className="nav-link">
            Login
          </Link>
        </div>
        <ThemeToggle />
      </nav>
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
