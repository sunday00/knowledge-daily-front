import { graphql } from '../__generated__'

export const OPINION_CREATE_MUTATION = graphql(`
  mutation OpinionCreate($input: OpinionCreateInput) {
    OpinionMutation {
      opinionCreate(input: $input) {
        success
        message
        item {
          _id
          sid
          createdAt
          parent
        }
      }
    }
  }
`)

export const OPINION_UPDATE_MUTATION = graphql(`
  mutation OpinionUpdate($input: OpinionUpdateInput) {
    OpinionMutation {
      opinionUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

export const OPINION_DELETE_MUTATION = graphql(`
  mutation OpinionDelete($input: SingleIdGraphReq) {
    OpinionMutation {
      opinionDelete(input: $input) {
        success
        message
        item
      }
    }
  }
`)
