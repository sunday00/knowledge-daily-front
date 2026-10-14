import { graphql } from '../__generated__'

export const USER_UPDATE_MUTATION = graphql(`
  mutation UserUpdate($input: UserUpdateInput!) {
    UserMutation {
      userUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)
