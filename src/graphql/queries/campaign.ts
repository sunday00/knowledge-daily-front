import { graphql } from '../__generated__'

// 비로그인 허용. 서버가 ACTIVE 이고 시작한 캠페인만 준다. (종료된 것도 포함)
// 홈 배너: exposedOn(노출 위치)으로 걸러 받는다.
export const CAMPAIGN_BANNER_LIST_QUERY = graphql(`
  query CampaignBannerList($input: CampaignListByQry) {
    CampaignQuery {
      campaignStandardList(input: $input) {
        success
        message
        items {
          _id
          type
          status
          title
          subTitle
          exposedOn
          startAt
          endAt
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

export const CAMPAIGN_ONE_QUERY = graphql(`
  query CampaignOne($input: CampaignOneByQry!) {
    CampaignQuery {
      campaignOne(input: $input) {
        success
        message
        item {
          _id
          type
          status
          title
          subTitle
          content
          startAt
          endAt
          createdAt
          components
          opinionsCnt
          reactionsCnt {
            name
            cnt
            me
          }
          links {
            key
            label
            href
            point
          }
          # 기간당 1인 횟수 (신청 / 링크 클릭 공통)
          maxes {
            duration
            unit
            cnt
          }
          applyLimit {
            available
            availableEach
            cost
            win
            sub
            startAt
            endAt
            announceAt
            me
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
        }
      }
    }
  }
`)

// 이벤트 메뉴 목록. 서버가 진행 중을 먼저, 그 안에서 sortKey 순으로 준다.
export const CAMPAIGN_LIST_QUERY = graphql(`
  query CampaignList($input: CampaignListByQry) {
    CampaignQuery {
      campaignStandardList(input: $input) {
        success
        message
        total
        maxPage
        items {
          _id
          type
          status
          title
          subTitle
          startAt
          endAt
          appliedCnt
          myApplied
          applyLimit {
            available
            availableEach
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
        }
      }
    }
  }
`)
