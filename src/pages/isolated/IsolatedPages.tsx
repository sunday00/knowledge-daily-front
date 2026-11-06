import { useParams } from 'react-router-dom'
import {
  IsolatedPageView,
  hasPageComponent,
  isolatedPageTarget,
} from '@/components/isolated/IsolatedPageView.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'

/** /page/:slug — 독립 페이지 + (opinion 이면) 대화록 */
export function IsolatedPageDetailPage() {
  return (
    <IsolatedPageView>
      {(item) =>
        hasPageComponent(item, 'Opinion') && <TargetThreads target={isolatedPageTarget(item)} />
      }
    </IsolatedPageView>
  )
}

/** /page/:slug/threads/:threadId — 독립 페이지 + 한 대화(thread)의 의견 목록 */
export function IsolatedPageThreadPage() {
  const { threadId = '' } = useParams<{ threadId: string }>()

  return (
    <IsolatedPageView>
      {(item) =>
        hasPageComponent(item, 'Opinion') && (
          <ThreadConversation target={isolatedPageTarget(item)} threadId={threadId} />
        )
      }
    </IsolatedPageView>
  )
}
