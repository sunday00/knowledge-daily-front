import { graphql } from '../__generated__'

// 비로그인 허용. 서버가 시작한 캠페인 중 status 로 거른다. (안 보내면 진행 중만)
// 캠페인 = 상위 캠페인 + 하위 아이템(참여형 ApplicableCampaign / 읽기형 ReadableCampaign)
// 첨부 flag (admin front - admin api - user front 간 약속값): 상위 banner·content, 하위 card

// 홈 배너: exposedOn(노출 위치)으로 걸러 받는다.
export const CAMPAIGN_BANNER_LIST_QUERY = graphql(`
  query CampaignBannerList($input: CampaignListByQry) {
    CampaignQuery {
      campaignStandardList(input: $input) {
        success
        message
        items {
          _id
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
          # 하위 아이템. sortKey 오름차순
          items {
            __typename
            ... on ApplicableCampaign {
              _id
              applicableSubType
              status
              sortKey
              startAt
              endAt
              cost
              available
              availableEach
              announceAt
              logLabel
              me
              appliedCnt
              winnerSetting {
                win
                winType
                sub
                rewards {
                  key
                  sortKey
                  tie
                  rewardLabel
                  rewardProduct
                  rewardAmount
                }
              }
              # 결과 발표(status RESULT) 일 때만 채워진다. 서버가 당첨(rewards 순) → 예비 당첨(subRank 순)으로 준다
              winners {
                _id
                applyStatus
                winRank
                subRank
                user {
                  _id
                  nickname
                }
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
            }
            ... on ReadableCampaign {
              _id
              readableSubType
              status
              sortKey
              startAt
              endAt
              clickLinkEvent {
                linkKey
                point
                maxes {
                  duration
                  unit
                  cnt
                }
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
            }
          }
        }
      }
    }
  }
`)

// 이벤트 메뉴 목록. 서버가 진행 중을 먼저, 그 안에서 sortKey 순으로 준다.
// 카드 배지(유형)와 내 참여 여부는 하위 아이템에서 만든다.
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
          status
          title
          subTitle
          startAt
          endAt
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
            # 진행 중 판단(아이템 기간이 전부 끝났는지) · 결과 발표 배지
            ... on ApplicableCampaign {
              _id
              applicableSubType
              status
              startAt
              endAt
              me
            }
            ... on ReadableCampaign {
              _id
              readableSubType
              status
              startAt
              endAt
              clickLinkEvent {
                point
              }
            }
          }
        }
      }
    }
  }
`)
