import { CAMPAIGN_PATH } from '@/lib/campaign.ts'
import { ISOLATED_PAGE_PATH } from '@/lib/isolatedPage.ts'
import { QUIZ_PATH } from '@/lib/quiz.ts'
import { threadPath } from '@/lib/opinionTarget.ts'
import { boardPath, findBoardById } from '@/lib/boards.ts'

/** 유저 메뉴 > 기록 */
export const RECORD_PATH = '/user/record'

/** 내 반응 아래 탭 (반응 대상 종류) */
export const REACTION_TYPES = [
  { key: 'sense', label: '상식' },
  { key: 'article', label: '게시글' },
  { key: 'thread', label: '대화록' },
  { key: 'opinion', label: '의견' },
] as const
export type RecordType = 'sense' | 'article' | 'opinion' | 'thread'

/** 기록 왼쪽 메뉴와 그 아래 탭 */
export const RECORD_MENU = [
  {
    key: 'sense',
    label: '내 상식',
    subs: [
      { key: 'made', label: '내가 만든 상식' },
      { key: 'received', label: '내가 받은 상식' },
    ],
  },
  {
    key: 'post',
    label: '내 게시글',
    subs: [
      { key: 'article', label: '게시글' },
      { key: 'ask', label: '문의' },
    ],
  },
  {
    key: 'opinion',
    label: '내 의견',
    subs: [
      { key: 'all', label: '전체' },
      { key: 'sense', label: '상식' },
      { key: 'board', label: '게시판' },
      { key: 'quiz', label: '퀴즈' },
    ],
  },
  { key: 'reaction', label: '내 반응', subs: REACTION_TYPES },
  {
    key: 'quiz',
    label: '내 퀴즈',
    subs: [
      { key: 'made', label: '내가 만든 퀴즈' },
      { key: 'tried', label: '내가 시도한 퀴즈' },
    ],
  },
] as const
export type RecordMenuKey = (typeof RECORD_MENU)[number]['key']

/** 반응 대상 종류 (reaction.targetEntity) */
export const REACTION_ENTITY: Record<RecordType, 'Sense' | 'Article' | 'Opinion' | 'Thread'> = {
  sense: 'Sense',
  article: 'Article',
  opinion: 'Opinion',
  thread: 'Thread',
}

export const RECORD_PAGE_SIZE = 20

/** 내 상식 > 내가 받은 상식 주소. tag 가 있으면 그 관심 태그로 거른다 (예전 /sense/my-sense) */
export const receivedSensePath = (tag?: string) =>
  `${RECORD_PATH}?${new URLSearchParams({ tab: 'sense', type: 'received', ...(tag && { tag }) }).toString()}`

/** 내 의견 탭별로 거를 원글 종류 (opinion.targetEntity). 전체는 거르지 않는다 */
export const OPINION_TAB_ENTITIES: Record<string, string[] | undefined> = {
  sense: ['Sense'],
  board: ['Article', 'Ask', 'Notice'],
  quiz: ['Quiz'],
}

/** enum 검색 조건 (서버 Range 형식): 하나면 eq, 여럿이면 mul(or) */
export const rangeOf = <T extends string>(values: readonly T[]) =>
  values.length === 1 ? { eq: values[0] } : { mul: [...values] }

/** 게시글 상세 주소. 게시판을 모르면 null */
export function articlePathOf(a: { _id: string; board: string }): string | null {
  const board = findBoardById(a.board)
  return board ? `${boardPath(board)}/${a._id}` : null
}

/**
 * 원글 주소. 게시글 / 문의는 게시판 id, 독립 페이지는 slug 가 있어야 만든다 (extra).
 * 모르는 종류거나 정보가 모자라면 null
 */
export function targetPathOf(
  entity: string,
  id: string,
  extra: { board?: string; slug?: string } = {},
): string | null {
  switch (entity) {
    case 'Sense':
      return `/sense/${id}`
    case 'Quiz':
      return `${QUIZ_PATH}/${id}`
    case 'Campaign':
      return `${CAMPAIGN_PATH}/${id}`
    case 'Notice':
      return `/board/notice/${id}`
    case 'Article':
    case 'Ask':
      return extra.board ? articlePathOf({ _id: id, board: extra.board }) : null
    case 'IsolatedPage':
      return extra.slug ? `${ISOLATED_PAGE_PATH}/${extra.slug}` : null
    default:
      return null
  }
}

/** 의견이 달린 대화 주소 */
export const opinionThreadPathOf = (targetPath: string | null, threadId: string) =>
  targetPath ? threadPath(targetPath, threadId) : null
