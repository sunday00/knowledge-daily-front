import { Outlet, useParams } from 'react-router-dom'
import { findBoardBySlug } from '@/lib/boards.ts'
import { BoardSidebar } from '@/components/BoardSidebar.tsx'

/** 게시판 공용 레이아웃. 목록 / 새 글 작성 어디서든 좌측 게시판 목록을 유지한다. */
export default function BoardLayout() {
  const { slug = '' } = useParams<{ slug: string }>()
  const board = findBoardBySlug(slug)

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <BoardSidebar activeId={board?._id} />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
