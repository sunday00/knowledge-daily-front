/** 캠페인(이벤트) 목록 주소 */
export const CAMPAIGN_PATH = '/campaign'
export const CAMPAIGN_TITLE = '이벤트'

/** 캠페인 상세 주소 */
export const campaignPath = (c: { _id: string }) => `${CAMPAIGN_PATH}/${c._id}`

/**
 * 하위 아이템 유형 라벨.
 * 참여형(ApplicableCampaign): LOTTERY_REWARD 경품 응모, LOTTERY_POINT 포인트 추첨
 * 읽기형(ReadableCampaign): IN_HOUSE 보기 보상(클릭 보상 없으면 안내), PARTNERSHIP 제휴
 */
export function campaignItemLabel(
  item:
    | { __typename?: 'ApplicableCampaign'; applicableSubType: string }
    | { __typename?: 'ReadableCampaign'; readableSubType: string; clickLinkEvent?: unknown },
): string {
  if ('applicableSubType' in item) {
    return item.applicableSubType === 'LOTTERY_POINT' ? '포인트 추첨' : '경품 응모'
  }
  if (item.readableSubType === 'PARTNERSHIP') return '제휴'
  return item.clickLinkEvent ? '보기 보상' : '안내'
}

/** 목록 카드 배지: 하위 아이템 라벨을 순서대로, 겹치면 한 번만 */
export const campaignItemLabels = (items: Parameters<typeof campaignItemLabel>[0][]) => [
  ...new Set(items.map(campaignItemLabel)),
]

// 서버 약속: 바로 시작이면 1970-01-01, 기한 없으면 9999-12-31 처럼 먼 날짜를 넣는다.
// 끝은 2200년 이후면 모두 무기한으로 본다.
const NO_START_BEFORE = Date.UTC(2000, 0, 1)
const NO_END_FROM = Date.UTC(2200, 0, 1)

const parse = (v: unknown) => (v == null ? null : Date.parse(v as string))
const formatDay = (ms: number) => new Date(ms).toLocaleDateString('ko-KR', { dateStyle: 'medium' })

/** 끝이 없는(무기한) 값인지 */
export const isEndless = (endAt: unknown) => {
  const e = parse(endAt)
  return e == null || e >= NO_END_FROM
}

/**
 * 'YYYY. M. D. ~ YYYY. M. D.' 형태. 바로 시작이면 시작을 비우고, 무기한이면 끝을 '무기한'으로.
 * 둘 다 없으면 '상시'
 */
export function periodText(startAt: unknown, endAt: unknown): string {
  const s = parse(startAt)
  const start = s != null && s >= NO_START_BEFORE ? formatDay(s) : null
  const endless = isEndless(endAt)
  if (!start && endless) return '상시'
  const end = endless ? '무기한' : formatDay(parse(endAt)!)
  return `${start ?? ''} ~ ${end}`.trim()
}

/** 끝났는지. 무기한 캠페인은 끝나지 않는다. */
export const isEnded = (endAt: unknown, now = Date.now()) =>
  !isEndless(endAt) && parse(endAt)! < now

/**
 * 닫힌 캠페인인지. 서버가 기간 지난 ACTIVE 도 CLOSE 로 주지만, 화면을 오래 열어 둔 사이 끝날 수 있어
 * 기간(startAt~endAt) 밖이면 닫힌 것으로 함께 본다.
 * 목록/배너/상세에서 흑백·종료 표시, 응모 막기에 쓴다.
 */
export const isClosedCampaign = (
  c: { status: string; startAt: unknown; endAt: unknown },
  now = Date.now(),
) => c.status === 'CLOSE' || now < (parse(c.startAt) ?? 0) || isEnded(c.endAt, now)

// 첨부 이미지 flag (admin front - admin api - user front 간 약속값)
/** 상위 배너 1024x400. 홈 캐러셀 / 목록 카드 / 상세 상단 */
export const CAMPAIGN_BANNER_FLAG = 'banner'
/** 상위 안내 이미지 (1024 폭, 세로로 긴 기간·참여 방법·경품 안내). 상세 본문 위 */
export const CAMPAIGN_CONTENT_FLAG = 'content'
/** 하위 아이템 카드 1024x576. 각 응모 / 보기 보상 블록 상단 */
export const CAMPAIGN_ITEM_CARD_FLAG = 'card'

/** 첨부 중 flag 가 맞는 것들 (sortKey 순). 대소문자는 가리지 않는다. */
export const filterAttachByFlag = <T extends { flag?: string | null; sortKey: number }>(
  attaches: readonly T[],
  flag: string,
) => attaches.filter((a) => a.flag?.toLowerCase() === flag).sort((a, z) => a.sortKey - z.sortKey)

/** 첨부 중 flag 가 맞는 첫 번째. 없으면 undefined */
export const findAttachByFlag = <T extends { flag?: string | null; sortKey: number }>(
  attaches: readonly T[],
  flag: string,
): T | undefined => filterAttachByFlag(attaches, flag)[0]

/** 상위 배너(flag=banner) 첨부 */
export const findBannerAttach = <T extends { flag?: string | null; sortKey: number }>(
  attaches: readonly T[],
) => findAttachByFlag(attaches, CAMPAIGN_BANNER_FLAG)

/** 배너 이미지가 없는 캠페인의 배경색. 같은 캠페인은 늘 같은 색이 나오게 _id 로 정한다. */
export function campaignColor(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))`
}

const MAX_UNIT_TEXT: Record<string, string> = {
  YYYY: '년',
  MM: '개월',
  DD: '일',
  HH: '시간',
  mm: '분',
  ss: '초',
}

/** 기간당 1인 횟수. { 1, DD, 3 } → '1일에 3회', { 10, mm, 1 } → '10분에 1회' */
export const maxText = (m: { duration: number; unit: string; cnt: number }) =>
  `${m.duration}${MAX_UNIT_TEXT[m.unit] ?? m.unit}에 ${m.cnt.toLocaleString()}회`

/** 하위 아이템 기간. 아이템에 없으면 상위 캠페인 기간 */
export const itemPeriod = (
  item: { startAt?: unknown; endAt?: unknown },
  parent: { startAt: unknown; endAt: unknown },
) => ({ startAt: item.startAt ?? parent.startAt, endAt: item.endAt ?? parent.endAt })

/**
 * 하위 아이템이 지금 동작하는지 (응모 / 클릭 보상).
 * 상위가 닫히지 않았고, 아이템이 ACTIVE 이고, 아이템 기간(없으면 상위 기간) 안.
 */
export const isItemOpen = (
  item: { status: string; startAt?: unknown; endAt?: unknown },
  parent: { status: string; startAt: unknown; endAt: unknown },
  now = Date.now(),
) =>
  !isClosedCampaign(parent, now) &&
  item.status === 'ACTIVE' &&
  !isClosedCampaign({ status: 'ACTIVE', ...itemPeriod(item, parent) }, now)

/**
 * '진행 중' 으로 보일지. 상위 기간(startAt~endAt)은 노출 기간이라 결과 발표용으로 남겨 두는 기간도 포함한다.
 * 그래서 상위가 열려 있어도 하위 아이템이 전부 끝났으면(기간 종료, 또는 ACTIVE 가 아님 — 결과 발표 등) 진행 중이 아니다.
 * 아이템이 없으면 상위 기간만 본다.
 */
export const isCampaignInProgress = (
  c: {
    status: string
    startAt: unknown
    endAt: unknown
    items: { status: string; startAt?: unknown; endAt?: unknown }[]
  },
  now = Date.now(),
) =>
  !isClosedCampaign(c, now) &&
  (c.items.length === 0 ||
    c.items.some((item) => item.status === 'ACTIVE' && !isEnded(itemPeriod(item, c).endAt, now)))

/** 결과가 발표된 참여형 아이템이 있는지 */
export const hasCampaignResult = (c: { items: { status?: string }[] }) =>
  c.items.some((item) => item.status === 'RESULT')
