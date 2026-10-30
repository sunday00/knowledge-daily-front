import { getSharedConfigs } from '@/lib/sharedConfigs.ts'

export type BoardConfig = {
  _id: string
  title: string
  label?: string | null
  /** 게시판 소개 (마크다운) */
  brief?: string | null
  children?: string
  categories?: { code: string; label: string }[]
}

/**
 * 제목을 주소용 문자열로. 카멜케이스는 단어로 나누고(AskTag → ask-tag, HTMLParser → html-parser),
 * 소문자, 공백/밑줄은 -, 글자·숫자·- 외 문자는 뺀다. (한글 유지)
 */
export function slugify(title: string): string {
  return title
    .trim()
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1-$2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1-$2')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const boardPath = (board: BoardConfig) => `/board/${slugify(board.title)}`

export type BoardGroup = { key: 'article' | 'ask'; title: string; boards: BoardConfig[] }

/** 공용 설정의 게시판을 대분류로 묶는다. 게시판(article(s)) 먼저, 그다음 문의/요청(ask). */
export function listBoardGroups(): BoardGroup[] {
  const boards = getSharedConfigs()?.boards as Record<string, BoardConfig[] | undefined> | undefined
  return [
    // 서버 키가 article 이지만 articles 로 바뀌어도 동작하도록 둘 다 본다.
    { key: 'article', title: '게시판', boards: boards?.articles ?? boards?.article ?? [] },
    { key: 'ask', title: '문의/요청', boards: boards?.ask ?? [] },
  ]
}

/** 공용 설정의 게시판 목록. 게시판(article(s)) 먼저, 그다음 문의/요청(ask). */
export function listBoards(): BoardConfig[] {
  return listBoardGroups().flatMap((g) => g.boards)
}

export function findBoardBySlug(slug: string): BoardConfig | undefined {
  return listBoards().find((b) => slugify(b.title) === slug)
}

/** 태그(주제) 추가/변경 요청을 받는 문의/요청 게시판 */
export const TAG_REQUEST_BOARD_TITLE = 'AskTag'

/** 게시판 글쓰기 주소. category 를 주면 그 분류를 미리 골라 둔다. */
export const boardWritePath = (board: BoardConfig, category?: string) =>
  `${boardPath(board)}/write${category ? `?category=${encodeURIComponent(category)}` : ''}`

export function findBoardByTitle(title: string): BoardConfig | undefined {
  return listBoards().find((b) => b.title === title)
}

export function findBoardById(id: string): BoardConfig | undefined {
  return listBoards().find((b) => b._id === id)
}
