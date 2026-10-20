import { ApolloError } from '@apollo/client'

// 화면 상단 ErrorBanner 에 띄울 에러 목록. React 밖(apollo link, window 이벤트 등)에서도 보고할 수 있게 모듈 store 로 둔다.
// 모바일 등 개발자도구가 없는 환경에서도 원인을 볼 수 있도록 상세 로그를 함께 담는다.

export type ReportedError = {
  id: number
  message: string
  log: string
}

let errors: ReportedError[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function reportError(message: string, detail?: unknown): void {
  const log = buildLog(message, detail)
  console.error(log, detail)
  errors = [...errors, { id: nextId++, message, log }]
  emit()
}

export function dismissError(id: number): void {
  errors = errors.filter((e) => e.id !== id)
  emit()
}

export function subscribeErrors(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getErrors(): ReportedError[] {
  return errors
}

function buildLog(message: string, detail?: unknown): string {
  const lines = [message, `time: ${new Date().toISOString()}`, `page: ${window.location.href}`]
  if (detail instanceof ApolloError) {
    lines.push(`endpoint: ${import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '(default)'}`)
    if (detail.networkError) lines.push(`networkError: ${stringify(detail.networkError)}`)
    if (detail.graphQLErrors.length) lines.push(`graphQLErrors: ${stringify(detail.graphQLErrors)}`)
  } else if (detail instanceof Error) {
    if (detail.stack) lines.push(`stack: ${detail.stack}`)
  } else if (detail !== undefined) {
    lines.push(`detail: ${stringify(detail)}`)
  }
  return lines.join('\n')
}

function stringify(value: unknown): string {
  try {
    // Error 는 message/stack 이 열거되지 않아 그냥 stringify 하면 {} 가 되므로 풀어서 넣는다.
    return JSON.stringify(
      value,
      (_key, v: unknown) =>
        v instanceof Error ? { ...v, name: v.name, message: v.message, stack: v.stack } : v,
      2,
    )
  } catch {
    return String(value)
  }
}
