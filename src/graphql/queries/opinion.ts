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
            villainStatus {
              isBlocked
              isSuspected
            }
            user {
              _id
              nickname
              villainStatus {
                isBlocked
              }
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
          villainStatus {
            isBlocked
            isSuspected
          }
          user {
            _id
            nickname
            villainStatus {
              isBlocked
            }
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
    villainStatus {
      isBlocked
      isSuspected
    }
    user {
      _id
      nickname
      villainStatus {
        isBlocked
      }
    }
  }
`)

// @sid 링크로 이동할 때: 그 의견이 어느 대화(parent) / 어느 상식(targetId) 것인지 알아낸다
export const OPINION_BY_SID_QUERY = graphql(`
  query OpinionBySid($input: OpinionListByQry) {
    OpinionQuery {
      opinionStandardList(input: $input) {
        success
        message
        items {
          _id
          sid
          parent
          targetId
        }
      }
    }
  }
`)
