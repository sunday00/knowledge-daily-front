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
        # 목록 순서상 바로 위(prev)/아래(next) 글. 상세의 이전글/다음글
        pn {
          prev {
            _id
            board
            quest
          }
          next {
            _id
            board
            quest
          }
        }
      }
    }
  }
`)

// 태그는 아직 서버가 채워 주지 않아(non-null 오류) 받지 않는다.
export const ARTICLE_LIST_QUERY = graphql(`
  query ArticleList($input: ArticleListByQry) {
    BoardQuery {
      articleList(input: $input) {
        success
        message
        total
        maxPage
        items {
          _id
          title
          # 목록에선 첨부가 있는지만 본다.
          attaches {
            sortKey
          }
          category
          pinn
          createdAt
          components
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
          user {
            _id
            nickname
          }
        }
      }
    }
  }
`)

export const ARTICLE_ONE_QUERY = graphql(`
  query ArticleOne($input: ArticleOneByQry!) {
    BoardQuery {
      articleOne(input: $input) {
        success
        message
        item {
          _id
          board
          title
          content
          attaches {
            sortKey
            attach {
              _id
              originalName
              src
            }
          }
          category
          pinn
          createdAt
          components
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
          user {
            _id
            nickname
          }
        }
        # 목록 순서상 바로 위(prev)/아래(next) 글. 상세의 이전글/다음글
        pn {
          prev {
            _id
            board
            title
          }
          next {
            _id
            board
            title
          }
        }
      }
    }
  }
`)
