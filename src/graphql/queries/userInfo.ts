import { graphql } from '../__generated__'

export const USER_INFO_QUERY = graphql(`
  query UserInfo {
    UserQuery {
      info {
        success
        message
        item {
          _id
          createdAt
          lv
          nickname
          roles
          sid
          status
          links {
            href
            label
          }
        }
      }
    }
  }
`)
