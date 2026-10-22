import { graphql } from '../__generated__'

export const SENSE_STANDARD_LIST_QUERY = graphql(`
  query SenseStandardList($input: SenseListByQry) {
    SenseQuery {
      senseStandardList(input: $input) {
        success
        message
        total
        hasNext
        items {
          _id
          title
          nativeLang
          description
          lv
          createdAt
          opinionsCnt
          tags {
            _id
            name
          }
        }
      }
    }
  }
`)

// 항목 필드는 SENSE_STANDARD_LIST_QUERY 와 동일하게 유지 (SenseItem 공용)
export const SENSE_MY_LIST_QUERY = graphql(`
  query SenseMyList($input: SenseListMyQry) {
    SenseQuery {
      senseMyList(input: $input) {
        success
        message
        total
        hasNext
        nextCursor
        items {
          _id
          title
          nativeLang
          description
          lv
          createdAt
          opinionsCnt
          tags {
            _id
            name
          }
        }
      }
    }
  }
`)

export const SENSE_ONE_QUERY = graphql(`
  query SenseOne($input: SenseOneByQry) {
    SenseQuery {
      senseOne(input: $input) {
        success
        message
        item {
          _id
          title
          nativeLang
          description
          detail
          lv
          createdAt
          opinionsCnt
          tags {
            _id
            name
          }
          attaches {
            sortKey
            attach {
              _id
              originalName
              src
            }
          }
        }
      }
    }
  }
`)
