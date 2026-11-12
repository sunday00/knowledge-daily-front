import { graphql } from '../__generated__'

/**
 * 캠페인 포인트 링크(Link.point > 0) 클릭 보상. item true = 지급 접수 (적립은 나중에), false = 지급 사유 비활성.
 * 횟수 초과 등은 에러 code 로 온다.
 */
export const CLICK_POINT_MUTATION = graphql(`
  mutation ClickPoint($input: PointClickSagaInput!) {
    PointMutation {
      clickPoint(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/**
 * 업적 달성 보상 포인트 받기. 달성했고 아직 안 받은(pointable) 업적만.
 * item true = 지급 접수 (적립과 pointable 제거는 나중에), false = 지급 사유 비활성.
 */
export const ACHIEVEMENT_POINT_MUTATION = graphql(`
  mutation AchievementPoint($input: PointAchievementSagaInput!) {
    PointMutation {
      achievementPoint(input: $input) {
        success
        message
        item
      }
    }
  }
`)
