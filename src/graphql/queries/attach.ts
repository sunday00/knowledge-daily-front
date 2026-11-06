import { graphql } from '../__generated__'

/**
 * 내 첨부 (업로드 완료만). search.keyword 로 별칭(flags) / 파일 이름 / 크기 이름 부분일치 (대소문자 무시).
 * 로그인 필요. 버린(내 목록에서 뺀) 이미지는 오지 않는다.
 */
export const ATTACH_MY_LIST_QUERY = graphql(`
  query AttachMyList($input: AttachListMyQry) {
    AttachQuery {
      attachMyList(input: $input) {
        success
        message
        total
        hasNext
        nextCursor
        items {
          _id
          type
          originalName
          flags
          createdAt
          src
          elements {
            name
            size
          }
        }
      }
    }
  }
`)
