import { print } from 'graphql'
import { SYSTEM_SHARED_CONFIGS_QUERY } from '@/graphql/queries/system.ts'
import { reportError } from '@/lib/errorReporter.ts'

// 서버 공용 설정(systemStates sharedconfigs.value). 로컬에 없으면 받아서 저장하고,
// 이후 모든 API 요청에 그 version 을 헤더로 실어 보낸다.
const KEY = 'knowledge-daily:sharedConfigs'
export const SHARED_CONFIGS_VERSION_HEADER = 'X-Shared-Configs-Version'

export type SharedConfigs = { version?: string } & Record<string, unknown>

const uri = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

/** 저장된 공용 설정. 없거나 읽을 수 없으면 null. */
export function getSharedConfigs(): SharedConfigs | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SharedConfigs)
      : null
  } catch {
    return null
  }
}

function saveSharedConfigs(value: SharedConfigs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // ignore (저장 공간 부족, 비공개 모드 등)
  }
}

let pending: Promise<SharedConfigs | null> | null = null
let updating = false

/** 메이저 버전이 바뀌어 다시 로그인 화면으로 이동하는 중인지. (이때는 요청을 다시 보내지 않는다) */
export function isServiceUpdating(): boolean {
  return updating
}

const majorOf = (version?: string) => version?.split('.')[0]

/** 메이저 업데이트: 로컬 저장소를 모두 비우고 새 설정만 남긴 채, 안내 문구와 함께 로그인 화면을 새로 연다. */
function restartForMajorUpdate(next: SharedConfigs): void {
  updating = true
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
  saveSharedConfigs(next)
  // 새로 불러와 Apollo 캐시와 로그인 상태(메모리)도 초기화한다.
  window.location.replace('/login?updated=1')
}

// Apollo 링크 안에서 부르므로 Apollo 를 거치지 않고 직접 요청한다. (링크 재귀 방지)
async function fetchSharedConfigs(): Promise<SharedConfigs | null> {
  const res = await fetch(uri, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'SystemSharedConfigs',
      query: print(SYSTEM_SHARED_CONFIGS_QUERY),
    }),
  })
  const body = (await res.json()) as {
    data?: {
      SystemQuery: { sharedConfigs: { success: number; message?: string | null; item: unknown } }
    }
    errors?: { message: string }[]
  }
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join(', '))
  const r = body.data?.SystemQuery.sharedConfigs
  if (!r?.success) throw new Error(r?.message ?? '서버가 실패를 반환했습니다.')
  if (!r.item || typeof r.item !== 'object' || Array.isArray(r.item)) return null
  return r.item as SharedConfigs
}

/**
 * 서버에서 공용 설정을 받아 로컬에 덮어쓴다. 동시에 여러 번 불려도 요청은 한 번만 한다.
 * 실패하면 null 을 돌려주고 (요청은 헤더 없이 진행), 다음 호출 때 다시 시도한다.
 */
export function refreshSharedConfigs(): Promise<SharedConfigs | null> {
  const prevVersion = getSharedConfigs()?.version
  pending ??= fetchSharedConfigs()
    .then((value) => {
      if (!value) return value
      // 이전에 받은 설정이 있고 메이저 버전이 바뀌었으면 서비스 업데이트로 보고 다시 로그인시킨다.
      if (prevVersion && majorOf(prevVersion) !== majorOf(value.version)) {
        restartForMajorUpdate(value)
      } else {
        saveSharedConfigs(value)
      }
      return value
    })
    .catch((e: unknown) => {
      reportError('[공용 설정 조회 실패]', e)
      return null
    })
    .finally(() => {
      pending = null
    })
  return pending
}

/** 로컬에 공용 설정이 없을 때만 받아서 저장한다. */
export function ensureSharedConfigs(): Promise<SharedConfigs | null> {
  const stored = getSharedConfigs()
  return stored ? Promise.resolve(stored) : refreshSharedConfigs()
}

/** 서버가 설정 버전이 다르다고 알려준 응답인지 */
export function isNotMatchedConfig(
  errors: readonly { extensions?: Record<string, unknown> }[] = [],
) {
  return errors.some((e) => e.extensions?.code === 'NOT_MATCHED_CONFIG')
}
