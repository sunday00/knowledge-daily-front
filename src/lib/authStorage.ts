// 인증 자체는 서버가 HttpOnly 쿠키로 관리합니다.
// 여기서는 UI 표시용 userId / nickname / archive 만 로컬에 보관합니다 (보안 목적 아님).
const USER_ID_KEY = 'auth_user_id'
const NICKNAME_KEY = 'auth_nickname'
const ARCHIVE_KEY = 'auth_archive'

/** 내 archive (프로필, 포인트 등). 로그인 응답으로 저장하고, 프로필을 바꾸면 img/attaches 를 갱신한다. */
export type StoredArchive = {
  _id: string
  /** 로그인 시점 포인트. cur = 보유, inc = 누적 획득 (써도 줄지 않음) */
  point?: { cur: number; inc: number }
  img?: { current?: { _id: string; code: string; type: string } | null } | null
  attaches: { sortKey: number; attach: { _id: string; src?: unknown } }[]
  /** 업적. available = 달성한 업적 id, applied = 적용한 칭호(sortKey 작을수록 앞), progress = 항목별 진행 수치 */
  achievements?: StoredAchievements | null
}

export type StoredAchievements = {
  available: string[]
  applied: { sortKey: number; name: string }[]
  /** 달성했지만 아직 보상 포인트를 받지 않은 업적 id (이 필드 전에 저장된 값엔 없다) */
  pointable?: string[]
  progress?: Record<string, number | null | undefined> | null
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getNickname(): string | null {
  return localStorage.getItem(NICKNAME_KEY)
}

// 화면이 구독할 수 있게 읽은 값을 들고 있는다. (같은 값이면 같은 객체를 돌려줘야 다시 그리지 않는다)
let archiveCache: { raw: string | null; value: StoredArchive | null } | null = null
const archiveListeners = new Set<() => void>()

export function getArchive(): StoredArchive | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(ARCHIVE_KEY)
  } catch {
    // 저장소를 못 쓰면 없는 것으로
  }
  if (archiveCache && archiveCache.raw === raw) return archiveCache.value
  let value: StoredArchive | null = null
  try {
    value = raw ? (JSON.parse(raw) as StoredArchive) : null
  } catch {
    value = null
  }
  archiveCache = { raw, value }
  return value
}

/** 내 archive 가 바뀌면 알림. 다른 탭에서 바뀐 것도 받는다. 해제 함수를 돌려준다. */
export function subscribeArchive(listener: () => void): () => void {
  archiveListeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === ARCHIVE_KEY || e.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    archiveListeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function writeArchive(archive: StoredArchive | null): void {
  try {
    if (archive) localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive))
    else localStorage.removeItem(ARCHIVE_KEY)
  } catch {
    // 저장공간 초과 등은 무시 — 표시용이라 없어도 동작한다
  }
  archiveListeners.forEach((l) => l())
}

/**
 * 서버에서 받은 내 프로필(img.current, attaches)을 로컬에도 반영한다. 바뀐 게 없으면 그대로.
 * 저장된 archive 가 없으면(이 기능 전에 로그인) 받은 값으로 새로 만든다.
 */
export function syncArchiveProfile(next: Pick<StoredArchive, '_id' | 'img' | 'attaches'>): void {
  const prev = getArchive()
  const merged: StoredArchive = {
    ...prev,
    _id: next._id,
    img: { current: next.img?.current ?? null },
    attaches: next.attaches,
  }
  if (
    prev &&
    JSON.stringify({ i: prev._id, c: prev.img?.current ?? null, a: prev.attaches }) ===
      JSON.stringify({ i: merged._id, c: merged.img?.current ?? null, a: merged.attaches })
  ) {
    return
  }
  writeArchive(merged)
}

/** 서버에서 받은 내 포인트 / 업적을 로컬에도 반영한다. 바뀐 게 없으면 그대로. 저장된 archive 가 없으면 하지 않는다. */
export function syncArchiveAchievements(next: Pick<StoredArchive, 'point' | 'achievements'>): void {
  const prev = getArchive()
  if (!prev) return
  const merged: StoredArchive = {
    ...prev,
    point: next.point ?? prev.point,
    achievements: next.achievements ?? null,
  }
  if (
    JSON.stringify({ p: prev.point, a: prev.achievements ?? null }) ===
    JSON.stringify({ p: merged.point, a: merged.achievements })
  ) {
    return
  }
  writeArchive(merged)
}

export function saveSession({
  userId,
  nickname,
  archive,
}: {
  userId: string
  nickname: string
  archive?: StoredArchive | null
}): void {
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(NICKNAME_KEY, nickname)
  writeArchive(archive ?? null)
}

export function updateNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname)
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(NICKNAME_KEY)
  writeArchive(null)
}
