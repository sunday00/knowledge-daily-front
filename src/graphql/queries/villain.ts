import { graphql } from '../__generated__'

// 내 차단 / 신고 관리. 서버가 로그인 유저 것만 준다. 대상은 targetEntity / targetId 만 와서 내용은 따로 조회한다.

/** 내 차단 목록 */
export const MY_BLOCK_LIST_QUERY = graphql(`
  query MyBlockList($input: BlockListBySearch) {
    VillainQuery {
      villainStandardBlockList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          targetEntity
          targetId
          createdAt
        }
      }
    }
  }
`)

/** 내 신고 목록. status: DRAFT 접수 → ACTIVE 검토 중 → CLOSE 처리 완료 */
export const MY_SUSPECT_LIST_QUERY = graphql(`
  query MySuspectList($input: SuspectListBySearch) {
    VillainQuery {
      villainStandardSuspectList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          targetEntity
          targetId
          quest
          status
          result
          answer
          handledAt
          createdAt
        }
      }
    }
  }
`)

/** 유저 한 명의 닉네임 / 프로필 (차단한 유저 표시용). 여러 명을 한 번에 찾는 쿼리가 없어 한 명씩 */
export const USER_ARCHIVE_QUERY = graphql(`
  query UserArchive($input: ArchiveOneMyQry) {
    ArchiveQuery {
      archiveUserOne(input: $input) {
        success
        item {
          _id
          user {
            _id
            nickname
            status
          }
          img {
            current {
              _id
              code
              type
            }
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
