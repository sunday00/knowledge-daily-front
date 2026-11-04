import { useParams } from 'react-router-dom'
import {
  CampaignOneView,
  campaignTarget,
  hasCampaignComponent,
} from '@/components/campaign/CampaignOneView.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'

/** /campaign/:type/:id — 캠페인 + (opinion 이면) 대화록 */
export function CampaignDetailPage() {
  return (
    <CampaignOneView>
      {(item) =>
        hasCampaignComponent(item, 'Opinion') && <TargetThreads target={campaignTarget(item)} />
      }
    </CampaignOneView>
  )
}

/** /campaign/:type/:id/threads/:threadId — 캠페인 + 한 대화(thread)의 의견 목록 */
export function CampaignThreadPage() {
  const { threadId = '' } = useParams<{ threadId: string }>()

  return (
    <CampaignOneView>
      {(item) =>
        hasCampaignComponent(item, 'Opinion') && (
          <ThreadConversation target={campaignTarget(item)} threadId={threadId} />
        )
      }
    </CampaignOneView>
  )
}
