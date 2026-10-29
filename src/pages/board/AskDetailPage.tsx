import { useParams } from 'react-router-dom'
import { AskOneView, hasComponent } from '@/components/board/AskOneView.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { boardPath } from '@/lib/boards.ts'

/** /board/:slug/:id — 문의/요청 글 + (Opinion 이면) 대화록 */
export default function AskDetailPage() {
  const { slug = '', id = '' } = useParams<{ slug: string; id: string }>()

  return (
    <AskOneView slug={slug} id={id}>
      {(item, board) =>
        hasComponent(item, 'Opinion') && (
          <TargetThreads
            target={{ entity: 'Ask', id: item._id, path: `${boardPath(board)}/${item._id}` }}
          />
        )
      }
    </AskOneView>
  )
}
