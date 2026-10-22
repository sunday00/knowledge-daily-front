import { graphql } from '../__generated__'

export const OPINION_CREATE_MUTATION = graphql(`
  mutation OpinionCreate($input: OpinionCreateInput) {
    OpinionMutation {
      opinionCreate(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)
