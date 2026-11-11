import { graphql } from '../__generated__'

// 비로그인 허용. 서버 기본 필터가 없어 DRAFT 도 섞여 오므로 목록은 status 를 꼭 보낸다.
export const QUIZ_LIST_QUERY = graphql(`
  query QuizList($input: QuizListByQry) {
    QuizQuery {
      quizList(input: $input) {
        success
        message
        total
        maxPage
        items {
          _id
          status
          title
          brief
          createdAt
          quizItemsCnt
          # 내 풀이 상태 (ALL_CORRECT / TRIED). 기록 없음·비로그인은 null
          me {
            _id
            status
          }
          tags {
            _id
            name
          }
          user {
            _id
            nickname
          }
        }
      }
    }
  }
`)

// 퀴즈 풀기 · 수정 · 만들기 2단계. 문항(quizItems)은 ACTIVE 만 sortKey 순으로 온다.
// 정답(answer)도 그대로 오므로 풀기 화면에서 가려 두었다가 바로 채점한다.
export const QUIZ_ONE_QUERY = graphql(`
  query QuizOne($input: QuizOneByQry!) {
    QuizQuery {
      quizOne(input: $input) {
        success
        message
        item {
          _id
          status
          title
          brief
          description
          createdAt
          quizItemsCnt
          # 내 풀이 기록 (유저 + 퀴즈당 한 건, 늘 최고 기록). 기록 없음·비로그인은 null
          # status 는 지금 문항 수 기준 (ALL_CORRECT / TRIED)
          me {
            _id
            status
            correctCnt
            tryCnt
            createdAt
            answers {
              quizItem
              answer
              correct
            }
          }
          tags {
            _id
            name
          }
          user {
            _id
            nickname
          }
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
          quizItems {
            _id
            ask
            answer
            answerOptions
            sortKey
            senses {
              senses
              hideSenseFields
              sortKey
            }
          }
        }
      }
    }
  }
`)

// 퀴즈 문항에 쓸 내 상식 고르기. 카드에 사진을 보여야 해서 SENSE_MY_LIST_QUERY 와 따로 둔다.
// (SENSE_MY_LIST_QUERY 는 SenseItem 공용 필드 + localStorage 캐시라 건드리지 않는다)
export const QUIZ_SENSE_PICK_LIST_QUERY = graphql(`
  query QuizSensePickList($input: SenseListMyQry) {
    SenseQuery {
      senseMyList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          title
          nativeLang
          description
          lv
          tags {
            _id
            name
          }
          attaches {
            sortKey
            attach {
              _id
              originalName
              src
              elements {
                name
                size
              }
            }
          }
        }
      }
    }
  }
`)

// 문항에 쓰인 상식들을 id 로 한 번에. 문항 senses 엔 id 만 있어 카드 내용은 따로 받는다.
export const QUIZ_SENSES_BY_IDS_QUERY = graphql(`
  query QuizSensesByIds($input: SenseListByQry) {
    SenseQuery {
      senseStandardList(input: $input) {
        success
        message
        items {
          _id
          title
          nativeLang
          description
          lv
          tags {
            _id
            name
          }
          attaches {
            sortKey
            attach {
              _id
              originalName
              src
              elements {
                name
                size
              }
            }
          }
        }
      }
    }
  }
`)
