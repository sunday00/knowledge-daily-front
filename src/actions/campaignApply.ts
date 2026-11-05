import { useEffect, useRef, useState } from 'react'
import { ApolloError, useApolloClient, useMutation } from '@apollo/client'
import { CAMPAIGN_APPLY_MUTATION } from '@/graphql/mutations/campaign.ts'
import { CAMPAIGN_LIST_QUERY, CAMPAIGN_ONE_QUERY } from '@/graphql/queries/campaign.ts'

const GRAPHQL = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'
/** 응모 결과(참가 포인트 차감 성공/실패)를 받는 SSE. 로그인 쿠키로 인증한다. */
const APPLY_RESULT_SSE = new URL('/campaign/sse/apply-result', GRAPHQL).href
const APPLY_RESULT_EVENT = 'campaign-apply-result'

const OPEN_TIMEOUT_MS = 10_000
// 서버는 약 10초 안에 못 보낸 결과를 버린다. 그보다 조금 더 기다리고, 넘으면 다시 조회해 확인한다.
const RESULT_TIMEOUT_MS = 20_000

type ApplyResultPayload = {
  result: 'SUCCESS' | 'FAIL'
  /** 응모한 하위 참여형 아이템 _id */
  applicableId: string
  userId: string
  /** FAIL 사유. SUCCESS 면 null */
  code: string | null
}

// 응모 검증 실패(mutation) / 차감 실패(SSE) 사유
const ERROR_TEXT: Record<string, string> = {
  CAMPAIGN_NOT_FOUND: '이벤트를 찾을 수 없습니다.',
  CAMPAIGN_NOT_APPLICABLE: '응모할 수 없는 이벤트입니다.',
  CAMPAIGN_APPLY_CLOSED: '응모 기간이 아닙니다.',
  CAMPAIGN_ALREADY_APPLIED: '응모할 수 있는 횟수를 모두 썼습니다.',
  CAMPAIGN_APPLY_TOO_OFTEN: '지금은 더 응모할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  CAMPAIGN_NOT_ACTIVE: '이벤트가 잠시 중단되었습니다.',
  CAMPAIGN_APPLY_FULL: '응모 인원이 다 찼습니다.',
  POINT_NOT_ENOUGH: '포인트가 부족합니다.',
  CAMPAIGN_NOT_APPLIED: '응모가 취소되었습니다.',
}
const EXPECTED_CODES = Object.keys(ERROR_TEXT)
const errorText = (code: string | null | undefined) =>
  (code && ERROR_TEXT[code]) ?? `응모에 실패했습니다.${code ? ` (${code})` : ''}`

export type ApplyState =
  | { step: 'idle' }
  | { step: 'connecting' | 'applying' | 'waiting' }
  | { step: 'done'; message: string }
  | { step: 'error'; message: string }

/** SSE 를 열고 연결(onopen)될 때까지 기다린다. 못 열면 reject */
function openApplyResult(): Promise<EventSource> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(APPLY_RESULT_SSE, { withCredentials: true })
    const timer = window.setTimeout(() => fail(), OPEN_TIMEOUT_MS)
    const fail = () => {
      window.clearTimeout(timer)
      es.close()
      reject(new Error('응모 결과를 받을 연결을 열지 못했습니다. 잠시 후 다시 시도해 주세요.'))
    }
    es.onopen = () => {
      window.clearTimeout(timer)
      es.onerror = null
      resolve(es)
    }
    // 연결 전 오류(비로그인 403 등). 그대로 두면 EventSource 가 계속 재연결하므로 닫는다.
    es.onerror = fail
  })
}

/** 이 아이템의 결과가 올 때까지 기다린다. 시간이 지나면 null */
function waitApplyResult(
  es: EventSource,
  applicableId: string,
): Promise<ApplyResultPayload | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), RESULT_TIMEOUT_MS)
    es.addEventListener(APPLY_RESULT_EVENT, (e) => {
      let payload: ApplyResultPayload
      try {
        payload = JSON.parse((e as MessageEvent<string>).data) as ApplyResultPayload
      } catch {
        return
      }
      if (payload.applicableId !== applicableId) return
      window.clearTimeout(timer)
      resolve(payload)
    })
  })
}

/**
 * 캠페인 응모.
 * 참가 포인트가 있으면: 결과 SSE 를 먼저 연결 → 연결되면 응모 → 차감 결과를 받고 연결을 닫는다.
 * (연결 전에 응모하면 결과를 놓칠 수 있다.) 참가 포인트가 없으면 응모 응답이 최종 결과.
 * 끝나면 상세/목록을 다시 받아 내 참여 상태, 포인트(x-user-point)를 맞춘다.
 */
export function useCampaignApply() {
  const [state, setState] = useState<ApplyState>({ step: 'idle' })
  const sseRef = useRef<EventSource | null>(null)
  const client = useApolloClient()
  const [mutate] = useMutation(CAMPAIGN_APPLY_MUTATION, {
    // 실패 사유는 버튼 옆에 보이므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: EXPECTED_CODES },
  })

  // 화면을 떠나면 열어 둔 연결을 닫는다.
  useEffect(() => () => sseRef.current?.close(), [])

  const busy = state.step === 'connecting' || state.step === 'applying' || state.step === 'waiting'

  /** applicableId: 응모할 하위 참여형 아이템 _id */
  const apply = async (applicableId: string, cost: number) => {
    if (busy) return
    let es: EventSource | null = null
    try {
      if (cost > 0) {
        setState({ step: 'connecting' })
        es = await openApplyResult()
        sseRef.current = es
      }
      setState({ step: 'applying' })
      const resultPromise = es ? waitApplyResult(es, applicableId) : null

      const { data } = await mutate({ variables: { input: { applicableId } } })
      const res = data?.CampaignMutation.campaignApply
      if (!res?.success) throw new Error(res?.message ?? '서버가 실패를 반환했습니다.')

      if (!resultPromise) {
        setState({ step: 'done', message: '응모했습니다.' })
        return
      }
      setState({ step: 'waiting' })
      const result = await resultPromise
      if (!result) {
        setState({
          step: 'done',
          message:
            '응모를 접수했습니다. 포인트 차감 결과는 잠시 후 내 참여 상태에서 확인해 주세요.',
        })
      } else if (result.result === 'SUCCESS') {
        setState({ step: 'done', message: '응모했습니다.' })
      } else {
        setState({ step: 'error', message: errorText(result.code) })
      }
    } catch (e: unknown) {
      const code =
        e instanceof ApolloError
          ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
          : undefined
      setState({
        step: 'error',
        message: code ? errorText(code) : e instanceof Error ? e.message : String(e),
      })
    } finally {
      es?.close()
      sseRef.current = null
      // 차감 실패면 서버가 응모를 지우므로, 결과까지 본 뒤에 다시 받는다.
      void client.refetchQueries({ include: [CAMPAIGN_ONE_QUERY, CAMPAIGN_LIST_QUERY] })
    }
  }

  /** 결과를 확인하고 처음 상태로 */
  const reset = () => {
    if (!busy) setState({ step: 'idle' })
  }

  return { apply, state, busy, reset }
}
