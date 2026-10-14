import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">404</h2>
      <p className="text-neutral-600 dark:text-neutral-400">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="nav-link">
        홈으로
      </Link>
    </section>
  )
}
