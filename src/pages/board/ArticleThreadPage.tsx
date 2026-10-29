import { useParams } from 'react-router-dom'
import { ArticleOneView, hasArticleComponent } from '@/components/board/ArticleOneView.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'
import { boardPath } from '@/lib/boards.ts'

/** /board/:slug/:id/threads/:threadId — 게시글 + 한 대화(thread)의 의견 목록 */
export default function ArticleThreadPage() {
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
    <ArticleOneView slug={slug} id={id}>
      {(item, board) =>
        hasArticleComponent(item, 'Opinion') && (
          <ThreadConversation
            target={{ entity: 'Article', id: item._id, path: `${boardPath(board)}/${item._id}` }}
            threadId={threadId}
          />
        )
      }
    </ArticleOneView>
  )
}
