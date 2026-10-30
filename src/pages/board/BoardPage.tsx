import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { boardPath, findBoardBySlug } from '@/lib/boards.ts'
import { AskList } from '@/components/board/AskList.tsx'
import { ArticleList } from '@/components/board/ArticleList.tsx'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { CategoryTabs } from '@/components/board/CategoryTabs.tsx'

export default function BoardPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const board = findBoardBySlug(slug)
  const { user } = useAuth()
  // 새 글 등록 후 돌아오면 안내한다.
  const created = (useLocation().state as { created?: boolean } | null)?.created
  const writeLink = user && board && (
    <Link to={`${boardPath(board)}/write`} className="btn no-underline">
      ✏️ 새 글 작성
    </Link>
  )

  return (
    <>
      {!board ? (
        <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{board.label || board.title}</h2>
          {/* 게시판 소개가 있으면 제목 아래에 (마크다운) */}
          {board.brief?.trim() && (
            <MarkdownView className="text-sm text-neutral-600 dark:text-neutral-400">
              {board.brief}
            </MarkdownView>
          )}
          {created && (
            <p role="status" className="text-sm text-brand-700 dark:text-indigo-300">
              글이 등록되었습니다.
            </p>
          )}
          {/* 분류가 있는 게시판이면 전체 / 분류별 탭 */}
          <CategoryTabs categories={board.categories ?? []} />
          {board.children === 'Ask' ? (
            <AskList board={board} action={writeLink} />
          ) : board.children === 'Article' ? (
            <ArticleList board={board} action={writeLink} />
          ) : (
            <p className="text-neutral-500">이 게시판은 아직 목록을 지원하지 않습니다.</p>
          )}
        </section>
      )}
    </>
  )
}
