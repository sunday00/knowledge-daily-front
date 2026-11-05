import { graphql } from '../__generated__'

/** 로그인 유저 확인. 가장 가벼운 로그인 요청이라 응답 헤더로 포인트(x-user-point)를 받는 데도 쓴다. */
export const AUTH_ME_QUERY = graphql(`
  query AuthMe {
    AuthQuery {
      me {
        success
        item {
          userId
        }
      }
    }
  }
`)
