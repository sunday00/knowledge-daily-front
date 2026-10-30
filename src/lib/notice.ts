/** 공지사항 주소. 게시판 메뉴 맨 위에 둔다. */
export const NOTICE_PATH = '/board/notice'
export const NOTICE_TITLE = '공지사항'

export const noticeItemPath = (id: string) => `${NOTICE_PATH}/${id}`

// 공지 분류 (admin front - admin api - user front 간 약속값). 목록 탭 순서. 여기 없는 값은 표시하지 않는다.
export const NOTICE_CATEGORIES = [
  /** 정책 변경, 게시판 신설, 설문조사 안내 등 */
  { code: 'normal', label: '일반공지' },
  { code: 'event', label: '이벤트' },
  { code: 'maintenance', label: '점검' },
] as const

export const noticeCategoryLabel = (code: string): string | null =>
  NOTICE_CATEGORIES.find((c) => c.code === code)?.label ?? null

/** 상단 고정: pinn 이거나 sortKey 가 기본값(1000)보다 작으면 (목록은 sortKey 오름차순) */
const DEFAULT_SORT_KEY = 1000
export const isPinnedNotice = (n: { pinn: boolean; sortKey: number }) =>
  n.pinn || n.sortKey < DEFAULT_SORT_KEY
