import { isLive } from '@/lib/liveWindow.ts'

/** 공지사항 주소. 게시판 메뉴 맨 위에 둔다. */
export const NOTICE_PATH = '/board/notice'
export const NOTICE_TITLE = '공지사항'

/** 노출 위치 (admin front - admin api - user front 간 약속값) */
export const NOTICE_SPOT = {
  /** 홈 배너 위 세로 롤링 */
  MAIN_ROLE: 'MAIN_ROLE',
} as const

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

/**
 * 고정(📌) 표시: pinn 인 공지 중 게시 기간(startAt~endAt) 안인 것만.
 * 게시 기간은 고정 표시와 홈 롤링에만 쓰고, 목록·상세·이전/다음글에는 영향이 없다.
 * sortKey 는 목록 순서를 당기는 용도일 뿐이라 고정 표시에 쓰지 않는다.
 */
export const isPinnedNotice = (
  n: { pinn: boolean; startAt: unknown; endAt: unknown },
  now = Date.now(),
) => n.pinn && isLive(n, now)
