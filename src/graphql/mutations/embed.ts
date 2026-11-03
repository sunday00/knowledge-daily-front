import { graphql } from '../__generated__'

/** 임베드 이미지 상식 신청(재신청이면 기존 코드 폐기 후 새로 발급, 기한 새로) */
export const EMBED_APPLY_MUTATION = graphql(`
  mutation EmbedApply($input: EmbedIssueInput) {
    EmbedMutation {
      embedApply(input: $input) {
        success
        message
        item {
          code
          src
          imgHtml
        }
      }
    }
  }
`)

/** 새 코드 발급. 기한/도메인은 그대로, 예전 코드로 붙인 이미지는 바로 막힌다. */
export const EMBED_CODE_REISSUE_MUTATION = graphql(`
  mutation EmbedCodeReissue {
    EmbedMutation {
      embedCodeReissue {
        success
        message
        item {
          code
          src
          imgHtml
        }
      }
    }
  }
`)

/** 현재 신청 설정 수정 (허용 도메인). 코드와 이미 붙인 이미지는 그대로 */
export const EMBED_UPDATE_MUTATION = graphql(`
  mutation EmbedUpdate($input: EmbedUpdateInput!) {
    EmbedMutation {
      embedUpdate(input: $input) {
        success
        message
        item {
          _id
          allowedDomains
          expiredAt
          status
          createdAt
        }
      }
    }
  }
`)
