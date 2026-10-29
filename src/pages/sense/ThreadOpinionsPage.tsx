import { useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'

/** /sense/:id/threads/:threadId — 상식 원글 + 한 대화(thread)의 의견 목록 */
export default function ThreadOpinionsPage() {
  const { id = '', threadId = '' } = useParams<{ id: string; threadId: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <ThreadConversation
          target={{ entity: 'Sense', id: sense._id, path: `/sense/${sense._id}` }}
          threadId={threadId}
        />
      )}
    </SenseOneView>
  )
}
