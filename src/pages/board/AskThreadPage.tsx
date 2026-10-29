import { useParams } from 'react-router-dom'
import { AskOneView, hasComponent } from '@/components/board/AskOneView.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'
import { boardPath } from '@/lib/boards.ts'

/** /board/:slug/:id/threads/:threadId — 문의/요청 글 + 한 대화(thread)의 의견 목록 */
export default function AskThreadPage() {
  const {
    slug = '',
    id = '',
    threadId = '',
  } = useParams<{
    slug: string
    id: string
    threadId: string
  }>()

  return (
    <AskOneView slug={slug} id={id}>
      {(item, board) =>
        hasComponent(item, 'Opinion') && (
          <ThreadConversation
            target={{ entity: 'Ask', id: item._id, path: `${boardPath(board)}/${item._id}` }}
            threadId={threadId}
          />
        )
      }
    </AskOneView>
  )
}
