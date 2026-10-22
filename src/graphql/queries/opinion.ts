import { graphql } from '../__generated__'

export const THREAD_STANDARD_LIST_QUERY = graphql(`
  query ThreadStandardList($input: ThreadListByQry) {
    OpinionQuery {
      threadStandardList(input: $input) {
        success
        message
        total
        hasNext
        nextCursor
        items {
          _id
          opinionsCnt
          createdAt
          opinion {
            _id
            sid
            content
            type
            status
            createdAt
            user {
              _id
              nickname
            }
          }
        }
      }
    }
  }
`)

export const OPINION_STANDARD_LIST_QUERY = graphql(`
  query OpinionStandardList($input: OpinionListByQry) {
    OpinionQuery {
      opinionStandardList(input: $input) {
        success
        message
        total
        hasNext
        nextCursor
        items {
          _id
          sid
          content
          type
          status
          createdAt
          user {
            _id
            nickname
          }
        }
      }
    }
  }
`)

// 의견 카드 한 장. 화면에만 붙여 둔(임시) 의견을 캐시에서 읽을 때 쓴다.
export const OPINION_ITEM_FRAGMENT = graphql(`
  fragment OpinionItemFields on Opinion {
    _id
    sid
    content
    type
    status
    createdAt
    user {
      _id
      nickname
    }
  }
`)
