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
          tags {
            _id
            name
          }
        }
      }
    }
  }
`)
