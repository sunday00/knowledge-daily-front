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

/** 내 첨부의 별칭(flags) 통째 교체. 내 것이 아니거나 없으면 ATTACH_NOT_FOUND */
export const ATTACH_FLAGS_UPDATE_MUTATION = graphql(`
  mutation AttachFlagsUpdate($input: AttachFlagsUpdateInput!) {
    AttachMutation {
      attachFlagsUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/** 내 미디어 목록에서 빼기. 파일과 이미 쓰인 곳의 첨부는 그대로 두고 내 목록에서만 사라진다. */
export const DE_RELATE_MY_ATTACH_MUTATION = graphql(`
  mutation DeRelateMyAttach($input: AttachDeRelateMyInput!) {
    AttachMutation {
      deRelateMyAttach(input: $input) {
        success
        message
        item
      }
    }
  }
`)
