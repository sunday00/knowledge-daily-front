/** 유저 메뉴 > 차단/신고 관리 */
export const VILLAIN_MANAGE_PATH = '/user/villain'

export type BlockEntity = 'User' | 'Article' | 'Opinion' | 'Quiz'

/** 차단 / 신고 대상 이름 */
export const TARGET_LABEL: Record<BlockEntity, string> = {
  User: '유저',
  Article: '게시글',
  Opinion: '의견',
  Quiz: '퀴즈',
}

/** 신고 상태 탭 (Suspect.status). 접수 DRAFT → 검토 중 ACTIVE → 처리 완료 CLOSE */
export const SUSPECT_TABS = [
  { key: 'all', label: '전체', status: null },
  { key: 'received', label: '접수됨', status: 'DRAFT' },
  { key: 'progress', label: '진행 중', status: 'ACTIVE' },
  { key: 'done', label: '처리됨', status: 'CLOSE' },
] as const

/** 왼쪽 메뉴와 그 아래 탭 */
export const VILLAIN_MENU = [
  {
    key: 'block',
    label: '차단',
    subs: (['User', 'Article', 'Opinion', 'Quiz'] as const).map((e) => ({
      key: e,
      label: TARGET_LABEL[e],
    })),
  },
  { key: 'suspect', label: '신고', subs: SUSPECT_TABS.map(({ key, label }) => ({ key, label })) },
] as const

export const VILLAIN_PAGE_SIZE = 20
