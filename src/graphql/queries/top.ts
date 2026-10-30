import { graphql } from '../__generated__'

// 인기 상식: 고른 리액션 수 * 1.5 + 최신 가중치 점수 순
export const SENSE_REACTION_TOP_QUERY = graphql(`
  query SenseReactionTop($input: ReactionTopByQry!) {
    ReactionQuery {
      reactionTopList(input: $input) {
        success
        message
        items {
          targetId
          cnt
          target {
            ... on Sense {
              _id
              title
              nativeLang
              description
              lv
              createdAt
              opinionsCnt
              reactionsCnt {
                name
                cnt
                me
              }
              tags {
                _id
                name
              }
            }
          }
        }
      }
    }
  }
`)

// 와글와글 상식: 의견 수 * 1.5 + 최신 가중치 점수 순
export const SENSE_OPINION_TOP_QUERY = graphql(`
  query SenseOpinionTop($input: OpinionTopByQry!) {
    OpinionQuery {
      opinionTopList(input: $input) {
        success
        message
        items {
          targetId
          cnt
          target {
            ... on Sense {
              _id
              title
              nativeLang
              description
              lv
              createdAt
              opinionsCnt
              reactionsCnt {
                name
                cnt
                me
              }
              tags {
                _id
                name
              }
            }
          }
        }
      }
    }
  }
`)

// 인기 게시글: 고른 리액션 수 * 1.5 + 최신 가중치 점수 순
export const ARTICLE_REACTION_TOP_QUERY = graphql(`
  query ArticleReactionTop($input: ReactionTopByQry!) {
    ReactionQuery {
      reactionTopList(input: $input) {
        success
        message
        items {
          targetId
          cnt
          target {
            ... on Article {
              _id
              board
              title
              attaches {
                sortKey
              }
              category
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
    }
  }
`)

// 댓글 많은 게시글: 의견 수 * 1.5 + 최신 가중치 점수 순
export const ARTICLE_OPINION_TOP_QUERY = graphql(`
  query ArticleOpinionTop($input: OpinionTopByQry!) {
    OpinionQuery {
      opinionTopList(input: $input) {
        success
        message
        items {
          targetId
          cnt
          target {
            ... on Article {
              _id
              board
              title
              attaches {
                sortKey
              }
              category
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
    }
  }
`)
