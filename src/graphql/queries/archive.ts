import { graphql } from '../__generated__'

/** 내 archive (프로필 이모지 등). input 이 없으면 로그인 유저 */
export const ARCHIVE_MY_QUERY = graphql(`
  query ArchiveMy {
    ArchiveQuery {
      archiveUserOne {
        success
        message
        item {
          _id
          img {
            current
            available
          }
        }
      }
    }
  }
`)

/** 고를 수 있는 프로필 이모지 목록 */
export const ARCHIVE_AVAILABLE_IMG_LIST_QUERY = graphql(`
  query ArchiveAvailableImgList($input: ArchiveAvailableImgListByQry) {
    ArchiveQuery {
      archiveAvailableImgList(input: $input) {
        success
        message
        items {
          code
          type
          subType
        }
      }
    }
  }
`)
