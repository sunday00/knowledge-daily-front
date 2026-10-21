import { graphql } from '../__generated__'

export const NOTIFY_SETTING_BY_USER_QUERY = graphql(`
  query NotifySettingByUser {
    NotifyQuery {
      notifySettingByUser {
        success
        message
        item {
          _id
          status
          fromUtcH
          version
          senseSetting {
            cntEach
            focusOn
            lvs
            notiTimes
          }
        }
      }
    }
  }
`)
