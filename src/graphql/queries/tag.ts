import { graphql } from '../__generated__'

export const TAG_STANDARD_LIST_QUERY = graphql(`
  query TagStandardList($input: TagListByQry) {
    TagQuery {
      tagStandardList(input: $input) {
        success
        message
        items {
          _id
          name
        }
      }
    }
  }
`)
