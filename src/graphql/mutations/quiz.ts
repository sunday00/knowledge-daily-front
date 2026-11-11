import { graphql } from '../__generated__'

/** 퀴즈 세트 생성. 늘 DRAFT 로 만들어지고 문항은 QUIZ_ITEMS_CREATE_MUTATION 으로 따로 넣는다. */
export const QUIZ_CREATE_MUTATION = graphql(`
  mutation QuizCreate($input: QuizCreateInput!) {
    QuizMutation {
      quizCreate(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)

/** 내 퀴즈에 문항 여러 개를 한 번에. 전부 들어가면 item true */
export const QUIZ_ITEMS_CREATE_MUTATION = graphql(`
  mutation QuizItemsCreate($input: QuizItemsCreateInput!) {
    QuizMutation {
      quizItemsCreate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/** 내 퀴즈 수정. ACTIVE 로 바꾸려면 ACTIVE 문항이 있어야 한다. (없으면 QUIZ_ITEMS_REQUIRED) */
export const QUIZ_UPDATE_MUTATION = graphql(`
  mutation QuizUpdate($input: QuizUpdateInput!) {
    QuizMutation {
      quizUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/** 내 문항 수정. 보낸 필드만 바뀐다. */
export const QUIZ_ITEM_UPDATE_MUTATION = graphql(`
  mutation QuizItemUpdate($input: QuizItemUpdateInput!) {
    QuizMutation {
      quizItemUpdate(input: $input) {
        success
        message
        item
      }
    }
  }
`)

/**
 * 퀴즈 풀이 저장 (공개 퀴즈만, 로그인 필요). 맞힌 수는 문항별 correct 로 서버가 센다.
 * 유저 + 퀴즈당 한 건: 기존 최고 이상이면 답을 바꾸고, 아니면 시도 횟수만 는다. 늘 저장된 최고 기록을 돌려준다.
 */
export const QUIZ_ANSWER_CREATE_MUTATION = graphql(`
  mutation QuizAnswerCreate($input: QuizAnswerCreateInput!) {
    QuizMutation {
      quizAnswerCreate(input: $input) {
        success
        message
        item {
          _id
          correctCnt
          tryCnt
          createdAt
        }
      }
    }
  }
`)
