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
