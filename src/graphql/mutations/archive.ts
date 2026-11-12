import { graphql } from '../__generated__'

export const ARCHIVE_UPSERT_MUTATION = graphql(`
  mutation ArchiveUpsert($input: ArchiveUpsertInput!) {
    ArchiveMutation {
      archiveUpsert(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/** 칭호(업적) 내걸기 토글. applied 에 있으면 해제, 없으면 추가 (달성한 것 중 3개까지) */
export const ARCHIVE_ACHIEVEMENT_APPLY_MUTATION = graphql(`
  mutation ArchiveAchievementApply($input: ArchiveAchievementApplyInput!) {
    ArchiveMutation {
      archiveAchievementApply(input: $input) {
        success
        message
        item {
          available
          pointable
          applied {
            sortKey
            name
          }
          progress {
            opinionCreate
            reactionCreate
            goodReceive
            earnPoints
          }
        }
      }
    }
  }
`)

/** 칭호 통째로 교체. names 순서가 곧 우선순위 (sortKey 0 부터). 달성한 것만, 3개까지, 중복 없이. [] 면 전부 해제 */
export const ARCHIVE_ACHIEVEMENT_APPLY_SET_MUTATION = graphql(`
  mutation ArchiveAchievementApplySet($input: ArchiveAchievementApplySetInput!) {
    ArchiveMutation {
      archiveAchievementApplySet(input: $input) {
        success
        message
        item {
          available
          pointable
          applied {
            sortKey
            name
          }
          progress {
            opinionCreate
            reactionCreate
            goodReceive
            earnPoints
          }
        }
      }
    }
  }
`)
