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
            current {
              _id
              code
              type
            }
            available
          }
          attaches {
            sortKey
            attach {
              _id
              src
            }
          }
        }
      }
    }
  }
`)

/** 내가 고를 수 있는 프로필 이모지 목록 (내 img.available 에 속한 것만) */
export const ARCHIVE_MY_AVAILABLE_IMG_LIST_QUERY = graphql(`
  query ArchiveMyAvailableImgList($input: ArchiveAvailableImgListByQry) {
    ArchiveQuery {
      archiveMyAvailableImgList(input: $input) {
        success
        message
        items {
          _id
          code
          type
          subType
        }
      }
    }
  }
`)
