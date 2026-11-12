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
          applied
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
