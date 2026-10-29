import { graphql } from '../__generated__'

export const ASK_CREATE_MUTATION = graphql(`
  mutation AskCreate($input: AskCreateInput!) {
    BoardMutation {
      askCreate(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)

export const ARTICLE_CREATE_MUTATION = graphql(`
  mutation ArticleCreate($input: ArticleCreateInput!) {
    BoardMutation {
      articleCreate(input: $input) {
        success
        message
        item {
          id
        }
      }
    }
  }
`)

export const ARTICLE_UPDATE_MUTATION = graphql(`
  mutation ArticleUpdate($input: ArticleUpdateInput!) {
    BoardMutation {
      articleUpdate(input: $input) {
        success
        message
      }
    }
  }
`)
