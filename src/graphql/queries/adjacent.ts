import { graphql } from '../__generated__'

// 상세 화면의 이전글/다음글. 같은 목록 조회를 _id 범위로 한 건씩, 한 요청에 두 번 받는다.
// prev: 더 오래된 글(_id < 현재, 최신순 1건) / next: 더 새 글(_id > 현재, 오래된순 1건)

export const ASK_ADJACENT_QUERY = graphql(`
  query AskAdjacent($prev: AskListByQry, $next: AskListByQry) {
    BoardQuery {
      prev: askList(input: $prev) {
        success
        items {
          _id
          quest
        }
      }
      next: askList(input: $next) {
        success
        items {
          _id
          quest
        }
      }
    }
  }
`)

export const ARTICLE_ADJACENT_QUERY = graphql(`
  query ArticleAdjacent($prev: ArticleListByQry, $next: ArticleListByQry) {
    BoardQuery {
      prev: articleList(input: $prev) {
        success
        items {
          _id
          title
        }
      }
      next: articleList(input: $next) {
        success
        items {
          _id
          title
        }
      }
    }
  }
`)

export const NOTICE_ADJACENT_QUERY = graphql(`
  query NoticeAdjacent($prev: NoticeListByQry, $next: NoticeListByQry) {
    NoticeQuery {
      prev: noticeStandardList(input: $prev) {
        success
        items {
          _id
          title
          startAt
          endAt
        }
      }
      next: noticeStandardList(input: $next) {
        success
        items {
          _id
          title
          startAt
          endAt
        }
      }
    }
  }
`)
