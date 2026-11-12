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
              applied
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
