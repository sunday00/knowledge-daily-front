import { formatDateTime } from '@/lib/formatDate.ts'

// 처음 만들 때 updatedAt 은 createdAt 과 같다. 저장 과정의 미세한 차이는 같은 것으로 본다.
const SAME_MS = 1000

/** 수정된 적이 있는지 (updatedAt 이 createdAt 과 다를 때) */
export function isEdited(createdAt: unknown, updatedAt: unknown): boolean {
  if (updatedAt == null) return false
  const c = new Date(createdAt as string).getTime()
  const u = new Date(updatedAt as string).getTime()
  return Number.isFinite(c) && Number.isFinite(u) && Math.abs(u - c) >= SAME_MS
}

/**
 * 수정 표시. 수정된 적이 없으면 아무것도 그리지 않는다.
 * 기본은 '· 수정됨 {날짜}', compact 면 목록용 '(수정됨)' (날짜는 툴팁)
 */
export function EditedAt({
  createdAt,
  updatedAt,
  compact = false,
}: {
  createdAt: unknown
  updatedAt?: unknown
  compact?: boolean
}) {
  if (!isEdited(createdAt, updatedAt)) return null
  const at = formatDateTime(updatedAt)
  return compact ? (
    <time dateTime={String(updatedAt)} title={`수정 ${at}`}>
      (수정됨)
    </time>
  ) : (
    <span>
      · 수정됨 <time dateTime={String(updatedAt)}>{at}</time>
    </span>
  )
}
