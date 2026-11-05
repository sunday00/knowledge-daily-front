import { graphql } from '../__generated__'

// 로그인 필요. 항상 내 포인트 내역만 온다. 차감은 delta 가 음수.
export const POINT_HISTORY_MY_LIST_QUERY = graphql(`
  query PointHistoryMyList($input: PointHistoryListMyQry) {
    PointQuery {
      pointHistoryMyList(input: $input) {
        success
        message
        total
        hasNext
        nextCursor
        items {
          _id
          delta
          balance
          createdAt
          reasonDetail {
            counterId
            counterLabel
          }
        }
      }
    }
  }
`)
