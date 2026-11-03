import { graphql } from '../__generated__'

/** 내 임베드 신청 상태. 신청한 적 없으면 EMBED_NOT_FOUND 에러 */
export const EMBED_MY_ONE_QUERY = graphql(`
  query EmbedMyOne {
    EmbedQuery {
      embedMyOne {
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
