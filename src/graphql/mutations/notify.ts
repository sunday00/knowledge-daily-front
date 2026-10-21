import { graphql } from '../__generated__'

export const NOTIFY_SETTING_UPDATE_MUTATION = graphql(`
  mutation NotifySettingUpdate($input: NotifySettingUpdateInput!) {
    NotifyMutation {
      notifySettingUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)
