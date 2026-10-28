import { graphql } from '../__generated__'

// 비로그인 허용. item 은 systemStates sharedconfigs.value (version, boards 등)
export const SYSTEM_SHARED_CONFIGS_QUERY = graphql(`
  query SystemSharedConfigs {
    SystemQuery {
      sharedConfigs {
        success
        message
        item
      }
    }
  }
`)
