import { graphql } from '../__generated__'

export const SYSTEM_HEALTH_QUERY = graphql(`
  query SystemHealth($input: SystemHealthQry!) {
    SystemQuery {
      health(input: $input) {
        success
        message
        item
      }
    }
  }
`)