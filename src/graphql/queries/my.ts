import { graphql } from '../__generated__'

// 개인설정 > 기록 (내 컨텐츠 / 내 반응). 목록은 커서(after / nextCursor)로 이어 받는다.

/** 반응 목록. 대상은 targetEntity / targetId 만 와서, 대상 내용은 따로 id 로 조회한다 */
export const MY_REACTION_LIST_QUERY = graphql(`
  query MyReactionList($input: ReactionListByQry) {
    ReactionQuery {
      reactionStandardList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          name
          targetEntity
          targetId
          createdAt
        }
      }
    }
  }
`)

/** 게시글 목록 (내가 쓴 글 / id 로 찾기). board 는 게시판 id */
export const MY_ARTICLE_LIST_QUERY = graphql(`
  query MyArticleList($input: ArticleListByQry) {
    BoardQuery {
      articleList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          board
          title
          category
          createdAt
          updatedAt
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
        }
      }
    }
  }
`)

/** 의견 목록 (내가 쓴 의견 / id 로 찾기). parentInfo = 원글 종류 / id 와 대화(thread) id */
export const MY_OPINION_LIST_QUERY = graphql(`
  query MyOpinionList($input: OpinionListByQry) {
    OpinionQuery {
      opinionStandardList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          sid
          content
          status
          createdAt
          parentInfo {
            targetEntity
            targetId
            threadId
          }
          reactionsCnt {
            name
            cnt
            me
          }
        }
      }
    }
  }
`)

/** 문의글의 게시판 id (원글 주소용) */
export const ASK_BOARD_LIST_QUERY = graphql(`
  query AskBoardList($input: AskListByQry) {
    BoardQuery {
      askList(input: $input) {
        success
        items {
          _id
          board
        }
      }
    }
  }
`)

/** 독립 페이지의 slug (원글 주소용) */
export const ISOLATED_PAGE_SLUG_LIST_QUERY = graphql(`
  query IsolatedPageSlugList($input: IsolatedPageListByQry) {
    IsolatedPageQuery {
      isolatedPageStandardList(input: $input) {
        success
        items {
          _id
          slug
        }
      }
    }
  }
`)

/**
 * 대화록 목록 (id 로 찾기). 항목 필드는 THREAD_STANDARD_LIST_QUERY 와 같고(ThreadItem 공용) 원글 종류 / id 를 더 받는다.
 */
export const MY_THREAD_LIST_QUERY = graphql(`
  query MyThreadList($input: ThreadListByQry) {
    OpinionQuery {
      threadStandardList(input: $input) {
        success
        message
        items {
          _id
          targetEntity
          targetId
          opinionsCnt
          createdAt
          reactionsCnt {
            name
            cnt
            me
          }
          opinion {
            _id
            sid
            content
            type
            status
            createdAt
            villainStatus {
              isBlocked
              isSuspected
              status
              result
            }
            user {
              _id
              nickname
              status
              archive {
                _id
                achievements {
                  applied {
                    sortKey
                    name
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
              villainStatus {
                isBlocked
                isSuspected
                status
                result
              }
            }
          }
        }
      }
    }
  }
`)

/** 문의 / 요청 글 목록 (내가 쓴 글). board 는 게시판 id */
export const MY_ASK_LIST_QUERY = graphql(`
  query MyAskList($input: AskListByQry) {
    BoardQuery {
      askList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          board
          category
          quest
          result
          createdAt
        }
      }
    }
  }
`)

/** 퀴즈 목록 (내가 만든 퀴즈). 항목 필드는 QUIZ_LIST_QUERY 와 같다 (QuizCard 공용) */
export const MY_QUIZ_LIST_QUERY = graphql(`
  query MyQuizList($input: QuizListByQry) {
    QuizQuery {
      quizList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          status
          title
          brief
          createdAt
          quizItemsCnt
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
            status
          }
        }
      }
    }
  }
`)

/** 내가 시도한 퀴즈 (마지막 시도 순). quiz 필드는 QUIZ_LIST_QUERY 항목과 같다 (QuizCard 공용). 공개(ACTIVE) 퀴즈만 온다 */
export const MY_QUIZ_ANSWER_LIST_QUERY = graphql(`
  query MyQuizAnswerList($input: QuizAnswerListMyQry) {
    QuizQuery {
      quizAnswerMyList(input: $input) {
        success
        message
        hasNext
        nextCursor
        items {
          _id
          correctCnt
          tryCnt
          status
          createdAt
          updatedAt
          quiz {
            _id
            status
            title
            brief
            createdAt
            quizItemsCnt
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
              status
            }
          }
        }
      }
    }
  }
`)
