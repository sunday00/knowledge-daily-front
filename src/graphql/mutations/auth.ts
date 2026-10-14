import { graphql } from '../__generated__'

export const KAKAO_LOGIN_MUTATION = graphql(`
  mutation AuthKakaoLogin($input: KakaoLoginInput!) {
    AuthMutation {
      authKakaoLogin(input: $input) {
        success
        message
        item {
          accessToken
          expiresIn
          isNewUser
          userId
          nickname
        }
      }
    }
  }
`)
