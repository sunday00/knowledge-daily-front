import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { boardPath, findBoardBySlug } from '@/lib/boards.ts'
import { useArticleOne } from '@/components/board/ArticleOneView.tsx'
import { ArticleForm } from '@/components/board/ArticleForm.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/** /board/:slug/:id/edit — 내 게시글 수정 */
export default function ArticleEditPage() {
  const { slug = '', id = '' } = useParams<{ slug: string; id: string }>()
  const board = findBoardBySlug(slug)
  const { user } = useAuth()
  const { res, item, loading, error } = useArticleOne(id)

  if (!user) return <Navigate to="/login" replace />
  if (!board) return <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>
  if (loading) return <LoadingSpinner />
  if (error && !res) return <p className="text-neutral-500">글을 찾을 수 없습니다.</p>
  if (!item)
    return (
      <p className="text-red-600 dark:text-red-400">{res?.message ?? '글을 찾을 수 없습니다.'}</p>
    )
  // 서버도 본인 글만 고치지만, 남의 글이면 폼 대신 상세로 돌려보낸다.
  if (item.user?._id !== user.userId) {
    return <Navigate to={`${boardPath(board)}/${item._id}`} replace />
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{board.label || board.title} · 글 수정</h2>
      {/* 다른 글로 바로 옮겨 가도 입력값이 남지 않도록 글마다 새로 그린다. */}
      <ArticleForm key={item._id} board={board} article={item} />
    </section>
  )
}
