import { graphql } from '../__generated__'

export const SENSE_ADD_MY_MUTATION = graphql(`
  mutation SenseAddMy($input: SenseAddMyInput!) {
    SenseMutation {
      addMySense(input: $input) {
        success
        message
        item
      }
    }
  }
`)

export const SENSE_REMOVE_MY_MUTATION = graphql(`
  mutation SenseRemoveMy($input: SenseRemoveMyInput!) {
    SenseMutation {
      removeMySense(input: $input) {
        success
        message
        item
      }
    }
  }
`)
