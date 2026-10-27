import { graphql } from '../__generated__'

// 의견/유저 차단 토글. item.res 가 'created'(차단됨) 또는 'deleted'(해제됨)
export const VILLAIN_TOGGLE_BLOCK_MUTATION = graphql(`
  mutation VillainToggleBlock($input: BlockCreateInput) {
    VillainMutation {
      villainToggleBlock(input: $input) {
        success
        message
        item
      }
    }
  }
`)

// 신고. 처리 전 같은 대상을 다시 신고하면 VILLAIN_SUSPECT_CREATE_DUPLICATED 에러
export const VILLAIN_CREATE_SUSPECT_MUTATION = graphql(`
  mutation VillainCreateSuspect($input: SuspectCreateInput) {
    VillainMutation {
      villainCreateSuspect(input: $input) {
        success
        message
        item
      }
    }
  }
`)
