// 서버가 차단한 유저/내용을 '%BLOCKED<%' 와 '%>BLOCKED%' 사이에 담아 보낸다.
const BLOCKED = /%BLOCKED<%([\s\S]*?)%>BLOCKED%/g

export type ContentPart = { blocked: boolean; text: string }

/** 본문을 일반 / 차단 구간으로 나눈다 */
export function splitBlocked(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  let last = 0
  for (const m of content.matchAll(BLOCKED)) {
    const start = m.index ?? 0
    if (start > last) parts.push({ blocked: false, text: content.slice(last, start) })
    parts.push({ blocked: true, text: m[1] })
    last = start + m[0].length
  }
  if (last < content.length) parts.push({ blocked: false, text: content.slice(last) })
  return parts
}

export const BLOCKED_NOTICE = '차단한 유저 또는 내용입니다.'

/** 링크 안 등 펼치기 버튼을 둘 수 없는 곳에서 쓰는, 차단 구간을 안내 문구로 바꾼 본문 */
export const maskBlocked = (content: string) =>
  splitBlocked(content)
    .map((p) => (p.blocked ? `(${BLOCKED_NOTICE})` : p.text))
    .join('')

type VillainFlags = { isBlocked: boolean } | null | undefined

export type BlockableOpinion = {
  content: string
  villainStatus?: VillainFlags
  user?: { villainStatus?: VillainFlags } | null
}

/** 이 의견이나 쓴 유저를 내가 차단했는지 (화면에서 차단/해제하면 캐시의 값이 바로 바뀐다) */
export const isBlockedOpinion = (opinion: BlockableOpinion) =>
  !!opinion.villainStatus?.isBlocked || !!opinion.user?.villainStatus?.isBlocked

/**
 * 화면에 그릴 본문. 서버가 씌운 차단 표시는 벗기고, 지금 캐시의 차단 상태로 다시 씌운다.
 * (목록을 다시 받지 않아도 차단/해제가 바로 반영되도록)
 */
export function blockedAwareContent(opinion: BlockableOpinion): string {
  // 차단 상태를 모르면 서버가 준 그대로
  if (opinion.villainStatus == null && opinion.user?.villainStatus == null) return opinion.content
  const raw = opinion.content.replace(BLOCKED, '$1')
  return isBlockedOpinion(opinion) ? `%BLOCKED<%${raw}%>BLOCKED%` : raw
}

// 목록에서 삭제된 글은 서버가 필드 값을 이 값으로 가려서 준다 (차단이면 %BLOCKED<% … %>BLOCKED% 로 한 번 더 감싼다)
const DELETED_MARK = '%DELETED%'

/**
 * 서버가 목록에서 가린 값(삭제 / 차단)이면 안내 문구, 아니면 null. noun = '글' / '퀴즈' 등.
 * 삭제는 펼쳐 볼 원문이 없어 차단이어도 삭제 문구로.
 */
export function maskedNoticeOf(value: string | null | undefined, noun: string): string | null {
  if (!value) return null
  const parts = splitBlocked(value)
  const blocked = parts.some((p) => p.blocked)
  const raw = blocked ? parts.map((p) => p.text).join('') : value
  if (raw === DELETED_MARK) return `삭제된 ${noun}입니다.`
  if (blocked) return `차단된 ${noun}입니다.`
  return null
}

/**
 * 서버가 목록에서 가린 값을 벗긴다 (내 차단 관리처럼 원래 내용을 보여 줘야 할 때).
 * deleted = 삭제된 것 (원래 내용이 없다)
 */
export function unmaskedOf(value: string): { deleted: boolean; text: string } {
  const text = splitBlocked(value)
    .map((p) => p.text)
    .join('')
  return { deleted: text === DELETED_MARK, text }
}
