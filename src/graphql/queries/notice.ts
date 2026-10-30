import { graphql } from '../__generated__'

// 비로그인 허용. 관리자가 쓴 공지사항.
export const NOTICE_LIST_QUERY = graphql(`
  query NoticeList($input: NoticeListByQry) {
    NoticeQuery {
      noticeStandardList(input: $input) {
        success
        message
        total
        maxPage
        items {
          _id
          category
          title
          # 목록에선 첨부가 있는지만 본다.
          attaches {
            sortKey
          }
          pinn
          sortKey
          startAt
          endAt
          createdAt
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

export const NOTICE_ONE_QUERY = graphql(`
  query NoticeOne($input: NoticeOneByQry!) {
    NoticeQuery {
      noticeOne(input: $input) {
        success
        message
        item {
          _id
          category
          title
          content
          pinn
          sortKey
          status
          startAt
          endAt
          createdAt
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
            title
            startAt
            endAt
          }
          next {
            _id
            title
            startAt
            endAt
          }
        }
      }
    }
  }
`)
