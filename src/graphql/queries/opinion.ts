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
            content
            type
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
          createdAt
          mentionTo
          user {
            _id
            nickname
          }
        }
      }
    }
  }
`)
