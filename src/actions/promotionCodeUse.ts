import { useState } from 'react'
import { ApolloError, useApolloClient, useMutation } from '@apollo/client'
import { PROMOTION_CODE_USE_MUTATION } from '@/graphql/mutations/promotion.ts'

const ERROR_TEXT: Record<string, string> = {
  PROMOTION_CODE_NOT_FOUND: '일치하는 프로모션 코드가 없습니다.',
  PROMOTION_CODE_CLOSED: '사용 기간이 아닌 프로모션 코드입니다.',
  PROMOTION_CODE_ALREADY_USED: '이미 사용한 프로모션 코드입니다.',
  PROMOTION_CODE_USED_UP: '다른 분이 이미 사용한 프로모션 코드입니다.',
  PROMOTION_CODE_FULL: '준비된 수량이 모두 소진되었습니다.',
  PROMOTION_CODE_NOT_ELIGIBLE: '이 프로모션 코드의 사용 대상이 아닙니다.',
}
// 적립은 console 이 나중에 한다. 이만큼 뒤에 다시 받아 포인트(x-user-point)를 맞춘다.
const POINT_REFRESH_MS = 3000

export type PromotionCodeResult = { ok: boolean; message: string } | null

/** 프로모션 코드 입력. 결과는 result 로 알린다. */
export function usePromotionCodeUse() {
  const client = useApolloClient()
  const [result, setResult] = useState<PromotionCodeResult>(null)
  const [mutate, { loading }] = useMutation(PROMOTION_CODE_USE_MUTATION, {
    // 결과는 입력창 아래에 보이므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
  })

  /** 성공(지급 접수)이면 true */
  const use = async (code: string): Promise<boolean> => {
    setResult(null)
    try {
      const { data } = await mutate({ variables: { input: { code } } })
      const res = data?.PromotionMutation.promotionCodeUse
      if (!res?.success || !res.item) {
        setResult({ ok: false, message: '지금은 이 프로모션 코드로 포인트를 받을 수 없습니다.' })
        return false
      }
      setResult({ ok: true, message: '프로모션 코드가 확인되었습니다. 포인트가 곧 적립됩니다.' })
      window.setTimeout(() => void client.refetchQueries({ include: 'active' }), POINT_REFRESH_MS)
      return true
    } catch (e: unknown) {
      const code =
        e instanceof ApolloError
          ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
          : undefined
      setResult({
        ok: false,
        message:
          (code && ERROR_TEXT[code]) ??
          '프로모션 코드를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
      return false
    }
  }

  return { use, loading, result }
}
