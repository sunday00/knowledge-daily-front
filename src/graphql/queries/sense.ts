import { graphql } from '../__generated__'

export const SENSE_STANDARD_LIST_QUERY = graphql(`
  query SenseStandardList($input: SenseListByQry) {
    SenseQuery {
      senseStandardList(input: $input) {
        __typename
      }
    }
  }
`)
