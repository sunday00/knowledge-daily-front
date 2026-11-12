import type { SharedConfigs } from '@/lib/sharedConfigs.ts'
import type { StoredAchievements } from '@/lib/authStorage.ts'
import achievementTitles from '@/data/achievementTitles.json'

/** 유저 메뉴 > 도전과제 */
export const ACHIEVEMENTS_PATH = '/user/achievements'

/** 칭호로 내걸 수 있는 개수 (서버 ACHIEVEMENT_APPLY_LIMIT) */
export const ACHIEVEMENT_APPLY_LIMIT = 3

const TITLES: Record<string, string | undefined> = achievementTitles

/** 도전과제 칭호 (src/data/achievementTitles.json). 매핑이 없으면 단계 설명 */
export function achievementTitle(id: string, key: string, cnt: number): string {
  return TITLES[id] ?? achievementGoalLabel(key, cnt)
}

/** 업적 한 단계. cnt 만큼 채우면 달성, reward 포인트를 받는다. */
export type AchievementGoal = { id: string; cnt: number; reward: number }

/** sharedConfigs.achievementItemConfigs. 키는 archive.achievements.progress 의 키와 같다. */
export type AchievementItemConfigs = Record<string, { goals: AchievementGoal[] }>

/** 달성 = available 에 있음, 달성 중 = 항목에서 아직 못 깬 첫 단계, 잠김 = 그 뒤 단계 */
export type AchievementStatus = 'achieved' | 'inProgress' | 'locked'

export type AchievementView = AchievementGoal & {
  /** 칭호 */
  title: string
  status: AchievementStatus
  /** archive.achievements.applied 에 있는지 */
  applied: boolean
}

export type AchievementItemView = {
  key: string
  title: string
  /** 진행 수치 (progress[key]) */
  current: number
  goals: AchievementView[]
}

/** 항목별 표시 이름과 단계 설명. 서버에 새 항목이 생기면 키 이름 그대로 보인다. */
export const ACHIEVEMENT_ITEM_META: Record<
  string,
  { title: string; goal: (cnt: string) => string }
> = {
  opinionCreate: { title: '의견 남기기', goal: (cnt) => `의견 ${cnt}개 남기기` },
  reactionCreate: { title: '반응하기', goal: (cnt) => `반응 ${cnt}번 하기` },
  goodReceive: { title: '좋아요 받기', goal: (cnt) => `좋아요 ${cnt}개 받기` },
  earnPoints: { title: '포인트 모으기', goal: (cnt) => `누적 ${cnt}P 모으기` },
}

/** 아직 달성하지 못한 도전과제의 칭호 / 개수 자리에 쓰는 표시 */
export const HIDDEN_MARK = '???'

/** 단계 설명. cnt 가 null 이면 개수를 숨긴다 (예: 의견 ???개 남기기) */
export function achievementGoalLabel(key: string, cnt: number | null): string {
  const meta = ACHIEVEMENT_ITEM_META[key]
  const n = cnt === null ? HIDDEN_MARK : cnt.toLocaleString()
  return meta ? meta.goal(n) : `${key} ${n}`
}

const isGoal = (v: unknown): v is AchievementGoal => {
  if (!v || typeof v !== 'object') return false
  const g = v as Record<string, unknown>
  return typeof g.id === 'string' && typeof g.cnt === 'number' && typeof g.reward === 'number'
}

/** 공용 설정에서 업적 설정을 읽는다. 없거나(이 기능 전에 받은 설정) 형식이 틀리면 null */
export function readAchievementItemConfigs(
  configs: SharedConfigs | null,
): AchievementItemConfigs | null {
  const raw = configs?.achievementItemConfigs
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: AchievementItemConfigs = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const goals = (value as { goals?: unknown } | null)?.goals
    if (!Array.isArray(goals)) continue
    out[key] = { goals: goals.filter(isGoal).sort((a, z) => a.cnt - z.cnt) }
  }
  return out
}

/**
 * 업적 설정과 내 archive.achievements 를 비교해 항목별 단계 상태를 만든다.
 * progress 가 늦게 갱신될 수 있어 진행 수치는 overrides(예: 응답 헤더의 누적 획득 포인트)와 큰 쪽을 쓴다.
 */
export function buildAchievementItems(
  configs: AchievementItemConfigs,
  achievements: StoredAchievements | null | undefined,
  overrides: Record<string, number | null | undefined> = {},
): AchievementItemView[] {
  const available = new Set(achievements?.available ?? [])
  const applied = new Set(achievements?.applied ?? [])
  return Object.entries(configs).map(([key, { goals }]) => {
    const current = Math.max(achievements?.progress?.[key] ?? 0, overrides[key] ?? 0)
    let nextFound = false
    const views = goals.map((g): AchievementView => {
      let status: AchievementStatus
      if (available.has(g.id)) status = 'achieved'
      else if (!nextFound) {
        nextFound = true
        status = 'inProgress'
      } else status = 'locked'
      return {
        ...g,
        title: achievementTitle(g.id, key, g.cnt),
        status,
        applied: applied.has(g.id),
      }
    })
    return { key, title: ACHIEVEMENT_ITEM_META[key]?.title ?? key, current, goals: views }
  })
}
