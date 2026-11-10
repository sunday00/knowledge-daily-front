import type { SenseKey } from '@/graphql/__generated__/graphql.ts'
import { attachSrcOf, attachThumbOf } from '@/hooks/useMyAttaches.ts'

/** 퀴즈 목록 주소 */
export const QUIZ_PATH = '/quiz'
export const QUIZ_TITLE = '퀴즈'

/** 퀴즈 만들기 1단계 (퀴즈 세트) */
export const QUIZ_NEW_PATH = `${QUIZ_PATH}/new`
/** 퀴즈 만들기 2단계부터 (문항) */
export const quizBuildPath = (quizId: string) => `${QUIZ_PATH}/${quizId}/build`
/** 내 풀이 상태 배지 (목록·풀기 화면). null 이면 표시 안 함 */
export const QUIZ_MY_STATUS: Record<string, { label: string; className: string }> = {
  ALL_CORRECT: {
    label: '정복함',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  TRIED: {
    label: '시도함',
    className: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
}

/** 퀴즈 목록 검색어 주소 파라미터 */
export const QUIZ_KEYWORD_PARAM = 'q'
/** 검색어로 거른 퀴즈 목록. 검색어는 제목 / 태그 이름 부분일치 또는 문항에 쓰인 상식 id (서버 통합 검색) */
export const quizSearchPath = (keyword: string) =>
  `${QUIZ_PATH}?${new URLSearchParams({ [QUIZ_KEYWORD_PARAM]: keyword })}`

/** 퀴즈 풀기 */
export const quizPath = (quizId: string) => `${QUIZ_PATH}/${quizId}`
/** 내 퀴즈 수정 (공개된 퀴즈) */
export const quizEditPath = (quizId: string) => `${QUIZ_PATH}/${quizId}/edit`

export const QUIZ_TITLE_MAX = 100
export const QUIZ_BRIEF_MAX = 200
/** 객관식 보기 최대 개수 */
export const QUIZ_OPTIONS_MAX = 6

/** 문항 카드에 보여 줄 상식. 내 상식 목록 항목에서 필요한 것만 */
export type QuizSenseCardData = {
  _id: string
  title: string
  nativeLang?: string | null
  description: string
  lv: number
  tags: { _id: string; name: string }[]
  /** 상식 사진 (sortKey 순). 예전에 임시 저장한 문항엔 없을 수 있다. */
  images?: QuizSenseImage[]
}

export type QuizSenseImage = { id: string; alt: string; thumb: string; full: string }

type SenseAttachLike = {
  sortKey: number
  attach: {
    _id: string
    originalName: string
    src?: unknown
    elements?: readonly { name: string; size: number[] }[]
  }
}

/** 상식 첨부 → 카드 사진 (작은 것 / 원본). 주소가 없는 건 뺀다. */
export const senseImagesOf = (attaches: readonly SenseAttachLike[]): QuizSenseImage[] =>
  [...attaches]
    .sort((a, z) => a.sortKey - z.sortKey)
    .map(({ attach }) => {
      const src = attachSrcOf(attach)
      const thumb = attachThumbOf(attach)
      return {
        id: attach._id,
        alt: attach.originalName,
        thumb,
        full: src.full ?? thumb,
      }
    })
    .filter((img) => img.thumb)

/** 문항에 놓인 상식 카드와 가릴 필드 */
export type QuizSenseDraft = {
  sense: QuizSenseCardData
  hide: SenseKey[]
}

/** 임시 저장한 문항. 퀴즈 세트 완료 때 한꺼번에(bulk) 보낸다. */
export type QuizItemDraft = {
  /** 화면에서만 쓰는 키 */
  key: string
  senses: QuizSenseDraft[]
  ask: string
  answer: string
  /** 비면 주관식 */
  answerOptions: string[]
}

/**
 * 카드에서 가릴 수 있는 상식 필드. (카드에 보이는 필드만)
 * WHOLE 은 카드 전체를 가린다.
 */
export const MASKABLE_SENSE_FIELDS: { key: SenseKey; label: string }[] = [
  { key: 'title', label: '제목' },
  { key: 'nativeLang', label: '원어' },
  { key: 'description', label: '설명' },
  { key: 'lv', label: '레벨' },
  { key: 'tags', label: '태그' },
  { key: 'attaches', label: '사진' },
  { key: 'WHOLE', label: '카드 전체' },
]

// 문항은 서버에 한 번에 보내기 전까지 브라우저에만 둔다. 새로 고침해도 이어서 만들 수 있게 퀴즈별로 저장.
const KEY_PREFIX = 'knowledge-daily:quizDraft:v1:'
const storageKey = (quizId: string) => `${KEY_PREFIX}${quizId}`

export function readQuizDraft(quizId: string): QuizItemDraft[] {
  try {
    const raw = localStorage.getItem(storageKey(quizId))
    return raw ? (JSON.parse(raw) as QuizItemDraft[]) : []
  } catch {
    return []
  }
}

export function writeQuizDraft(quizId: string, items: QuizItemDraft[]): void {
  try {
    localStorage.setItem(storageKey(quizId), JSON.stringify(items))
  } catch {
    // 저장공간 초과 등은 조용히 무시 — 새로 고침 때 이어 만들기가 안 될 뿐
  }
}

export function clearQuizDraft(quizId: string): void {
  try {
    localStorage.removeItem(storageKey(quizId))
  } catch {
    // 무시
  }
}

/** 문항 입력값 검사. 문제가 있으면 안내 문구 */
export function validateQuizItem(item: Omit<QuizItemDraft, 'key'>): string | null {
  if (item.senses.length === 0) return '문항에 쓸 상식을 하나 이상 고르세요.'
  if (!item.ask.trim()) return '문제를 입력하세요.'
  if (!item.answer.trim()) return '정답을 입력하세요.'
  const options = item.answerOptions.map((o) => o.trim())
  if (options.length > 0) {
    if (options.length < 2) return '보기는 두 개 이상 입력하세요.'
    if (options.some((o) => !o)) return '비어 있는 보기가 있습니다.'
    if (new Set(options).size !== options.length) return '같은 보기가 있습니다.'
    if (!options.includes(item.answer.trim())) return '정답을 보기 중에서 고르세요.'
  }
  return null
}

/** 서버 문항의 상식 정보 */
type QuizItemSenseInfoLike = { senses: string; hideSenseFields: SenseKey[]; sortKey: number }

/** 지워졌거나 못 불러온 상식 자리 */
const missingSense = (id: string): QuizSenseCardData => ({
  _id: id,
  title: '(찾을 수 없는 상식)',
  description: '',
  lv: 0,
  tags: [],
})

/** 서버 문항의 senses + 불러온 상식 → 화면 카드 (sortKey 순) */
export const senseDraftsOf = (
  infos: readonly QuizItemSenseInfoLike[],
  senses: ReadonlyMap<string, QuizSenseCardData>,
): QuizSenseDraft[] =>
  [...infos]
    .sort((a, z) => a.sortKey - z.sortKey)
    .map((info) => ({
      sense: senses.get(info.senses) ?? missingSense(info.senses),
      hide: info.hideSenseFields,
    }))

/** 화면 카드 → 서버로 보낼 문항 senses */
export const senseInfosOf = (senses: readonly QuizSenseDraft[]) =>
  senses.map((s, i) => ({ senses: s.sense._id, hideSenseFields: s.hide, sortKey: i + 1 }))

/** 채점용으로 답을 고른다: 앞뒤·중복 공백, 대소문자 무시 */
const normalizeAnswer = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

export const isCorrectAnswer = (given: string, answer: string) =>
  normalizeAnswer(given) === normalizeAnswer(answer)
