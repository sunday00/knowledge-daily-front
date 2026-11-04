import { graphql } from '../__generated__'

/** 캠페인 응모. 참가 포인트가 있으면 차감은 나중에 처리되고 결과는 SSE 로 온다. */
export const CAMPAIGN_APPLY_MUTATION = graphql(`
  mutation CampaignApply($input: CampaignApplySagaInput!) {
    CampaignMutation {
      campaignApply(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)
