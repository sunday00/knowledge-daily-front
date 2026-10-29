import { graphql } from '../__generated__'

export const ATTACH_PRESIGN_MUTATION = graphql(`
  mutation AttachPresign($input: AttachPresignInput!) {
    AttachMutation {
      attachPresign(input: $input) {
        success
        message
        item {
          id
          upload
          sig
        }
      }
    }
  }
`)

export const ATTACH_UPLOADED_MUTATION = graphql(`
  mutation AttachUploaded($input: AttachUploadedInput!) {
    AttachMutation {
      attachUploaded(input: $input) {
        success
        message
        item {
          _id
          src
        }
      }
    }
  }
`)
