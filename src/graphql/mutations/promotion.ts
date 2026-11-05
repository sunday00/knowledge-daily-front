import { graphql } from '../__generated__'

/**
 * 프로모션 코드 입력. item true = 포인트 지급 접수 (적립은 나중에), false = 지급 사유 비활성.
 * 미일치 / 기간 외 / 횟수 초과 등은 에러 code 로 온다. 코드는 대소문자 구분, 앞뒤 공백은 서버가 지운다.
 */
export const PROMOTION_CODE_USE_MUTATION = graphql(`
  mutation PromotionCodeUse($input: PromotionCodeUseSagaInput!) {
    PromotionMutation {
      promotionCodeUse(input: $input) {
        success
        message
        item
      }
    }
  }
`)
