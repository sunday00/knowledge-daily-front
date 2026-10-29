import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { boardPath, findBoardBySlug } from '@/lib/boards.ts'
import { AskList } from '@/components/board/AskList.tsx'

export default function BoardPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const board = findBoardBySlug(slug)
  const { user } = useAuth()
  // 새 글 등록 후 돌아오면 안내한다.
  const created = (useLocation().state as { created?: boolean } | null)?.created

  return (
    <>
      {!board ? (
        <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{board.label || board.title}</h2>
            {user && (
              <Link to={`${boardPath(board)}/write`} className="btn no-underline">
                ✏️ 새 글 작성
              </Link>
            )}
          </div>
          {board.categories && board.categories.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {board.categories.map((c) => (
                <li
                  key={c.code}
                  className="text-xs rounded-full px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          {created && (
            <p role="status" className="text-sm text-brand-700 dark:text-indigo-300">
              글이 등록되었습니다.
            </p>
          )}
          {board.children === 'Ask' ? (
            <AskList board={board} />
          ) : (
            <p className="text-neutral-500">(게시글 목록 추후 추가 예정)</p>
          )}
        </section>
      )}
    </>
  )
}
