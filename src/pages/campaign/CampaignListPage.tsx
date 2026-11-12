import { CAMPAIGN_TITLE } from '@/lib/campaign.ts'
import { CampaignList } from '@/components/campaign/CampaignList.tsx'

/** /campaign — 이벤트(캠페인) 목록 */
export default function CampaignListPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold">{CAMPAIGN_TITLE}</h2>
      <CampaignList />
    </section>
  )
}
