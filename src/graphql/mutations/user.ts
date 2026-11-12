import { graphql } from '../__generated__'

export const USER_UPDATE_MUTATION = graphql(`
  mutation UserUpdate($input: UserUpdateInput!) {
    UserMutation {
      userUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/**
 * 회원 탈퇴 (로그인 유저). item true = 탈퇴 완료, false = 이미 탈퇴한 상태. 같은 계정 재가입은 제한 기간 뒤.
 * input.reason 은 선택. 없거나 공백이면 서버가 JUST_EMPTY_REASON 으로 저장한다.
 */
export const USER_RESIGN_MUTATION = graphql(`
  mutation UserResign($input: UserResignInput) {
    UserMutation {
      userResign(input: $input) {
        success
        message
        item
      }
    }
  }
`)
