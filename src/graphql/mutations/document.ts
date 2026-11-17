import { graphql } from '../__generated__'

/** slug 별 지금 시행 중인 문서에 동의 (서버가 문서별로 user.agreements 에 합쳐 저장). 이름(AgreeDocuments)으로 동의 대기 중에도 보낸다 */
export const AGREE_DOCUMENTS_MUTATION = graphql(`
  mutation AgreeDocuments($input: DocumentAgreeInput!) {
    DocumentMutation {
      documentAgree(input: $input) {
        success
        message
        item
      }
    }
  }
`)
