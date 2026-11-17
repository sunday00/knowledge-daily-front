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
          archive {
            _id
            point {
              cur
              inc
            }
            achievements {
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
  }
`)

/** 로그아웃. 서버가 accessToken 쿠키를 만료시킨다 (비로그인 / 만료 토큰이어도 항상 성공) */
export const AUTH_LOGOUT_MUTATION = graphql(`
  mutation AuthLogout {
    AuthMutation {
      authLogout {
        success
        message
        item
      }
    }
  }
`)
