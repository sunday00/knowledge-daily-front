import { graphql } from '../__generated__'

// 비로그인 허용. 개인정보처리방침, 이용약관, 소개 등. revision 이 없으면 지금 시행 중인 문서.
export const DOCUMENT_ONE_QUERY = graphql(`
  query DocumentOne($input: DocumentOneBySlugQry!) {
    DocumentQuery {
      documentOne(input: $input) {
        success
        message
        item {
          _id
          type
          slug
          title
          content
          revision
          effectiveAt
        }
      }
    }
  }
`)

// 동의 받기 모달용. 지금 시행 중인 문서 (_id 를 동의 기록으로 보낸다). 이름(AgreementDocument)으로 동의 대기 중에도 보낸다
export const AGREEMENT_DOCUMENT_QUERY = graphql(`
  query AgreementDocument($input: DocumentOneBySlugQry!) {
    DocumentQuery {
      documentOne(input: $input) {
        success
        message
        item {
          _id
          slug
          title
          content
          revision
          effectiveAt
        }
      }
    }
  }
`)
