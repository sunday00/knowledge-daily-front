import { useState } from 'react'
import { ApolloError, useApolloClient, useMutation } from '@apollo/client'
import { CLICK_POINT_MUTATION } from '@/graphql/mutations/point.ts'
import { CAMPAIGN_ONE_QUERY } from '@/graphql/queries/campaign.ts'

const ERROR_TEXT: Record<string, string> = {
  CAMPAIGN_NOT_FOUND: '이벤트를 찾을 수 없어 포인트가 지급되지 않습니다.',
  CAMPAIGN_CLICK_CLOSED: '이벤트 기간이 아니라 포인트가 지급되지 않습니다.',
  CAMPAIGN_CLICK_NOT_REWARDED: '포인트가 지급되는 링크가 아닙니다.',
  CAMPAIGN_CLICK_TOO_OFTEN: '잠시 후 다시 누르면 포인트를 받을 수 있습니다.',
  CAMPAIGN_NOT_ACTIVE: '이벤트가 잠시 중단되어 포인트가 지급되지 않습니다.',
}
// 적립은 console 이 나중에 한다. 이만큼 뒤에 다시 받아 포인트(x-user-point)를 맞춘다.
const POINT_REFRESH_MS = 3000

export type ClickNotice = { ok: boolean; message: string } | null

/**
 * 캠페인 포인트 링크 클릭 보상. 이동을 막지 않도록 응답을 기다리지 않고 보낸다.
 * 접수되면 잠시 뒤 캠페인을 다시 받아 포인트를 갱신하고, 결과는 notice 로 알린다. (새 탭으로 연 경우 보인다)
 */
export function useClickPoint() {
  const client = useApolloClient()
  const [notice, setNotice] = useState<ClickNotice>(null)
  const [mutate] = useMutation(CLICK_POINT_MUTATION, {
    // 결과는 링크 아래에 보이므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
  })

  /** readableId: 클릭 보상이 걸린 하위 읽기형 아이템 _id */
  const click = (readableId: string, linkKey: string, point: number) => {
    setNotice(null)
    mutate({ variables: { input: { readableId, linkKey } } })
      .then(({ data }) => {
        const res = data?.PointMutation.clickPoint
        // false = 지급 사유 비활성. 조용히 넘어간다.
        if (!res?.success || !res.item) return
        setNotice({ ok: true, message: `${point.toLocaleString()}P 가 곧 적립됩니다.` })
        window.setTimeout(
          () => void client.refetchQueries({ include: [CAMPAIGN_ONE_QUERY] }),
          POINT_REFRESH_MS,
        )
      })
      .catch((e: unknown) => {
        const code =
          e instanceof ApolloError
            ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
            : undefined
        if (code && ERROR_TEXT[code]) setNotice({ ok: false, message: ERROR_TEXT[code] })
      })
  }

  return { click, notice }
}
