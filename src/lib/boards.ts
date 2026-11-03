import { getSharedConfigs } from '@/lib/sharedConfigs.ts'
import { slugify } from '@/lib/slugify.ts'

// sitemap 생성(vite-plugins/sitemap.ts)도 같은 규칙을 써야 해서 따로 둔다.
export { slugify }

export type BoardConfig = {
  _id: string
  title: string
  label?: string | null
  /** 게시판 소개 (마크다운) */
  brief?: string | null
  children?: string
  categories?: { code: string; label: string }[]
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
