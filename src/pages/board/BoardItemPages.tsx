import { useParams } from 'react-router-dom'
import { findBoardBySlug } from '@/lib/boards.ts'
import AskDetailPage from '@/pages/board/AskDetailPage.tsx'
import AskThreadPage from '@/pages/board/AskThreadPage.tsx'
import ArticleDetailPage from '@/pages/board/ArticleDetailPage.tsx'
import ArticleThreadPage from '@/pages/board/ArticleThreadPage.tsx'

// 같은 주소 모양(/board/:slug/:id ...)을 게시판 종류(children)에 따라 나눠 그린다.
function useBoardKind() {
  const { slug = '' } = useParams<{ slug: string }>()
  return findBoardBySlug(slug)?.children
}

/** /board/:slug/:id */
export function BoardItemPage() {
  return useBoardKind() === 'Article' ? <ArticleDetailPage /> : <AskDetailPage />
}

/** /board/:slug/:id/threads/:threadId */
export function BoardThreadPage() {
  return useBoardKind() === 'Article' ? <ArticleThreadPage /> : <AskThreadPage />
}
