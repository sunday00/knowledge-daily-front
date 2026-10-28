import { graphql } from '../__generated__'

export const TAG_STANDARD_LIST_QUERY = graphql(`
  query TagStandardList($input: TagListByQry) {
    TagQuery {
      tagStandardList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          name
        }
      }
    }
  }
`)

export const TAG_TOP_FOCUS_LIST_QUERY = graphql(`
  query TagTopFocusList($input: TagTopFocusQry) {
    TagQuery {
      tagTopFocusList(input: $input) {
        success
        message
        items {
          cnt
          tag {
            _id
            name
          }
        }
      }
    }
  }
`)
