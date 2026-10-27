import { useState } from 'react'
import { ApolloError, useApolloClient, useMutation, type ApolloCache } from '@apollo/client'
import {
  VILLAIN_CREATE_SUSPECT_MUTATION,
  VILLAIN_TOGGLE_BLOCK_MUTATION,
} from '@/graphql/mutations/villain.ts'
import type { VBlockTargetEntity } from '@/graphql/__generated__/graphql.ts'
import { reportError } from '@/lib/errorReporter.ts'

// 신고 데이터 스키마 버전
const SUSPECT_VERSION = '1.0'
export const REPORT_MAX_LENGTH = 300

export type BlockTarget = { entity: VBlockTargetEntity; id: string }

type VillainFlags = {
  __typename?: 'VillainStatus'
  isBlocked?: boolean
  isSuspected?: boolean
  status?: string | null
  result?: string | null
}

/** 캐시의 대상(Opinion / User) villainStatus 를 고치고, 고치기 전 값을 돌려준다 */
function patchVillainStatus(
  cache: ApolloCache<unknown>,
  target: BlockTarget,
  next: Partial<VillainFlags>,
): VillainFlags | null {
  let before: VillainFlags | null = null
  cache.modify({
    id: cache.identify({ __typename: target.entity, _id: target.id }),
    fields: {
      villainStatus: (prev) => {
        before = (prev as VillainFlags | null) ?? null
        return { __typename: 'VillainStatus', ...before, ...next }
      },
    },
  })
  return before
}

/**
 * 의견 / 유저 차단 토글. 캐시를 먼저 바꿔 화면(같은 유저의 다른 의견 포함)에 바로 반영하고,
 * 서버 반영이 실패하면 되돌리고 상단 에러 배너로 알린다.
 */
export function useToggleBlock() {
  const client = useApolloClient()
  const [mutate] = useMutation(VILLAIN_TOGGLE_BLOCK_MUTATION)

  const toggle = (target: BlockTarget, block: boolean): void => {
    const label = `${target.entity === 'User' ? '유저' : '의견'} 차단${block ? '' : ' 해제'}`
    const before = patchVillainStatus(client.cache, target, { isBlocked: block })

    void (async () => {
      try {
        const { data } = await mutate({
          variables: {
            input: { targetEntity: target.entity, targetId: target.id, reasons: [] },
          },
        })
        const result = data?.VillainMutation.villainToggleBlock
        if (!result?.success) throw new Error(result?.message ?? '서버가 실패를 반환했습니다.')
        // 서버는 토글이라, 화면이 이미 어긋나 있었다면 서버 결과(created=차단, deleted=해제)에 맞춘다
        const res = (result.item as { res?: string } | null)?.res
        if (res === 'created' || res === 'deleted') {
          patchVillainStatus(client.cache, target, { isBlocked: res === 'created' })
        }
      } catch (e: unknown) {
        patchVillainStatus(client.cache, target, { isBlocked: before?.isBlocked ?? !block })
        reportError(`[${label} 실패]`, e)
      }
    })()
  }

  return { toggle }
}

const isDuplicatedReport = (e: unknown) =>
  e instanceof ApolloError &&
  e.graphQLErrors.some((g) => g.extensions?.code === 'VILLAIN_SUSPECT_CREATE_DUPLICATED')

/** 의견 / 유저 신고. 성공하면(이미 접수된 신고였어도) 캐시에 신고함으로 표시한다. */
export function useReport() {
  const client = useApolloClient()
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: sending }] = useMutation(VILLAIN_CREATE_SUSPECT_MUTATION)

  const markReported = (target: BlockTarget) =>
    // 막 접수된 신고: 접수(DRAFT) 단계, 결과 미정(IDLE)
    patchVillainStatus(client.cache, target, { isSuspected: true, status: 'DRAFT', result: 'IDLE' })

  /** 접수되면 true */
  const report = async (target: BlockTarget, raw: string): Promise<boolean> => {
    setError(null)
    const quest = raw.trim()
    if (!quest) {
      setError('신고 사유를 고르세요.')
      return false
    }

    try {
      const { data } = await mutate({
        variables: {
          input: {
            targetEntity: target.entity,
            targetId: target.id,
            quest,
            attaches: [],
            version: SUSPECT_VERSION,
          },
        },
      })
      const result = data?.VillainMutation.villainCreateSuspect
      if (!result?.success) {
        setError(result?.message ?? '서버가 실패를 반환했습니다.')
        return false
      }
      markReported(target)
      return true
    } catch (e: unknown) {
      // 처리되지 않은 신고가 이미 있으면 이미 신고한 것으로 본다
      if (isDuplicatedReport(e)) {
        markReported(target)
        return true
      }
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  return { report, sending, error }
}
