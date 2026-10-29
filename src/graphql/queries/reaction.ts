import { graphql } from '../__generated__'

// 카드의 리액션 집계만 캐시에서 읽는다 (토글하면 캐시를 바로 고치므로 화면이 따라 바뀐다)
export const OPINION_REACTIONS_FRAGMENT = graphql(`
  fragment OpinionReactions on Opinion {
    _id
    reactionsCnt {
      name
      cnt
      me
    }
  }
`)

export const THREAD_REACTIONS_FRAGMENT = graphql(`
  fragment ThreadReactions on ThreadResItem {
    _id
    reactionsCnt {
      name
      cnt
      me
    }
  }
`)

export const SENSE_REACTIONS_FRAGMENT = graphql(`
  fragment SenseReactions on Sense {
    _id
    reactionsCnt {
      name
      cnt
      me
    }
  }
`)

export const ASK_REACTIONS_FRAGMENT = graphql(`
  fragment AskReactions on Ask {
    _id
    reactionsCnt {
      name
      cnt
      me
    }
  }
`)

export const ARTICLE_REACTIONS_FRAGMENT = graphql(`
  fragment ArticleReactions on Article {
    _id
    reactionsCnt {
      name
      cnt
      me
    }
  }
`)

// 대화록 한 건의 리액션. 대화 페이지에 바로 들어와 캐시에 그 대화가 없을 때 받는다
export const THREAD_REACTIONS_QUERY = graphql(`
  query ThreadReactions($input: ThreadListByQry) {
    OpinionQuery {
      threadStandardList(input: $input) {
        success
        message
        items {
          ...ThreadReactions
        }
      }
    }
  }
`)
