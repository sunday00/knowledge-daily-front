import { graphql } from '../__generated__'

// 리액션 토글. 같은 대상·이름에 내가 이미 했으면 지운다. item.result 가 'created' 또는 'deleted'
export const REACTION_CREATE_MUTATION = graphql(`
  mutation ReactionCreate($input: ReactionCreateInput) {
    ReactionMutation {
      reactionCreate(input: $input) {
        success
        message
        item
      }
    }
  }
`)
