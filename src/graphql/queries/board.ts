import { graphql } from '../__generated__'

export const ASK_LIST_QUERY = graphql(`
  query AskList($input: AskListByQry) {
    BoardQuery {
      askList(input: $input) {
        success
        message
        total
        maxPage
        items {
          _id
          category
          quest
          result
          answer
          createdAt
          handledAt
          components
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
        }
      }
    }
  }
`)

export const ASK_ONE_QUERY = graphql(`
  query AskOne($input: AskOneByQry!) {
    BoardQuery {
      askOne(input: $input) {
        success
        message
        item {
          _id
          board
          category
          quest
          result
          answer
          createdAt
          handledAt
          components
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
        }
      }
    }
  }
`)
