import { graphql } from '../__generated__'

// 독립 페이지 (/page/:slug). 서버가 ACTIVE 페이지만, items 는 ACTIVE 만 sortKey 순으로 준다.
// 아이템: 텍스트(마크다운, href 면 링크) / 첨부 / 상식 목록 / 참여형 캠페인
// 첨부 flag: 페이지 banner (제목 대신 / 홈 캐러셀)

export const ISOLATED_PAGE_ONE_QUERY = graphql(`
  query IsolatedPageOne($input: IsolatedPageOneBySlugQry!) {
    IsolatedPageQuery {
      isolatedPageOne(input: $input) {
        success
        message
        item {
          _id
          slug
          title
          subTitle
          components
          reactionsCnt {
            name
            cnt
            me
          }
          links {
            key
            label
            href
          }
          attaches {
            sortKey
            flag
            attach {
              _id
              src
              elements {
                name
                size
              }
            }
          }
          items {
            __typename
            sortKey
            status
            ... on IsolatedPageTextItem {
              content
              href
            }
            ... on IsolatedPageAttachItem {
              content
              attaches {
                sortKey
                flag
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
            # SenseItem 카드 필드 (SENSE_STANDARD_LIST_QUERY 와 같게)
            ... on IsolatedPageSenseItem {
              senses {
                _id
                title
                nativeLang
                description
                lv
                createdAt
                opinionsCnt
                reactionsCnt {
                  name
                  cnt
                  me
                }
                tags {
                  _id
                  name
                }
              }
            }
            # 응모 블록은 상위 캠페인(CAMPAIGN_ONE_QUERY)으로 그린다. 여기선 id 만
            ... on IsolatedPageApplicableItem {
              campaign {
                _id
                campaign
              }
            }
          }
        }
      }
    }
  }
`)

// 홈 캐러셀: 노출 위치(exposedOn) 하나로 거른다.
export const ISOLATED_PAGE_BANNER_LIST_QUERY = graphql(`
  query IsolatedPageBannerList($input: IsolatedPageListByQry) {
    IsolatedPageQuery {
      isolatedPageStandardList(input: $input) {
        success
        message
        items {
          _id
          slug
          title
          subTitle
          sortKey
          attaches {
            sortKey
            flag
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
