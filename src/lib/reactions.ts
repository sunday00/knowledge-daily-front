// 고를 수 있는 리액션. 화면엔 emoji, 서버엔 code(name) 로 보낸다
// 배열 순서가 곧 노출 순서: 긍정 -> 중립 -> 부정. 고르는 창, 집계 모두 이 순서를 따른다.
export const REACTIONS = [
  { code: 'love', emoji: '❤️', label: '마음에 들어요' },
  { code: 'good', emoji: '👍', label: '좋아요' },
  { code: 'clap', emoji: '👏', label: '박수' },
  { code: 'helpful', emoji: '📚', label: '유익해요' },
  { code: 'aha', emoji: '💡', label: '아하!' },
  { code: 'convinced', emoji: '👌', label: '납득했어요' },
  { code: 'funny', emoji: '😂', label: '웃겨요' },
  { code: 'hot', emoji: '🔥', label: '뜨거워요' },
  { code: 'surprised', emoji: '😲', label: '놀라워요' },
  { code: 'question', emoji: '🤔', label: '의문이에요' },
  { code: 'objection', emoji: '🙋', label: '이의 있어요' },
  { code: 'bad', emoji: '👎', label: '별로예요' },
] as const

export type ReactionCode = (typeof REACTIONS)[number]['code']

const byCode = new Map<string, (typeof REACTIONS)[number]>(REACTIONS.map((r) => [r.code, r]))

const orderOf = new Map<string, number>(REACTIONS.map((r, i) => [r.code, i]))

/** 서버 응답 순서와 상관없이 항상 REACTIONS 순서(긍정 -> 부정)로. 모르는 name 은 맨 뒤. */
export const sortReactions = <T extends { name: string }>(list: readonly T[]): T[] =>
  [...list].sort(
    (a, z) => (orderOf.get(a.name) ?? REACTIONS.length) - (orderOf.get(z.name) ?? REACTIONS.length),
  )

/** 서버의 name 으로 표시할 emoji / 설명. 모르는 name 이면 name 그대로 */
export const reactionOf = (name: string) =>
  byCode.get(name) ?? { code: name, emoji: name, label: name }

/** 인기 상식 집계에 넣는 긍정 리액션 (별로예요 / 의문 / 이의 있어요는 뺀다) */
export const POPULAR_REACTION_CODES: ReactionCode[] = [
  'good',
  'aha',
  'convinced',
  'surprised',
  'helpful',
  'clap',
  'love',
  'funny',
  'hot',
]
