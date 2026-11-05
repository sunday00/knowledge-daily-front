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
