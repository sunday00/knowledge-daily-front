import { graphql } from '../__generated__'

// 비로그인 허용. exposedOn(노출 위치)·startAt~endAt(노출 기간)으로 걸러 받는다.
export const BANNER_LIST_QUERY = graphql(`
  query BannerList($input: BannerListByQry) {
    BannerQuery {
      bannerStandardList(input: $input) {
        success
        message
        items {
          _id
          title
          subTitle
          isTitleExpose
          exposedOn
          startAt
          endAt
          sortKey
          links {
            href
            label
          }
          attaches {
            sortKey
            attach {
              _id
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
