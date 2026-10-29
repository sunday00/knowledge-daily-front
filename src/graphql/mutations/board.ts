import { graphql } from '../__generated__'

export const ASK_CREATE_MUTATION = graphql(`
  mutation AskCreate($input: AskCreateInput!) {
    BoardMutation {
      askCreate(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)
