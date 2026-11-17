import { useSyncExternalStore } from 'react'

// 로그인 유저가 아직 동의하지 않은(또는 개정된) 문서가 있으면 서버가 AuthQuery.me 에서 이 에러를 준다 (useAgreementCheck).
// extensions.detail = 동의가 필요한 문서 slug 목록
export const DOCUMENTS_UNAGREED = 'DOCUMENTS_UNAGREED'

/** 동의를 기다리는 동안에도 보내는 요청 (문서 보기 / 동의 저장 / 로그아웃). 나머지는 막는다 */
export const AGREEMENT_OPERATIONS = new Set(['AgreementDocument', 'AgreeDocuments', 'AuthLogout'])

let pending: string[] | null = null
const listeners = new Set<() => void>()

/** 동의가 필요한 문서 slug. 없으면 null */
export const getPendingAgreements = () => pending

/** 동의가 필요한 문서를 정한다. null / [] 이면 해제 (같은 목록이면 알리지 않는다) */
export function setPendingAgreements(next: string[] | null) {
  const value = next && next.length > 0 ? next : null
  if (value?.join('\n') === pending?.join('\n')) return
  pending = value
  listeners.forEach((l) => l())
}

export function usePendingAgreements(): string[] | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pending,
  )
}

type CodedError = { extensions?: Record<string, unknown> | null }

/** 에러 목록에 동의 필요 에러가 있으면 문서 slug 목록, 없으면 null */
export function unagreedSlugsOf(errors: readonly CodedError[] | null | undefined): string[] | null {
  const err = errors?.find((e) => e.extensions?.code === DOCUMENTS_UNAGREED)
  if (!err) return null
  const detail = err.extensions?.detail
  return Array.isArray(detail) ? detail.filter((s): s is string => typeof s === 'string') : []
}
