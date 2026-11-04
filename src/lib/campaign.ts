import { slugify } from '@/lib/slugify.ts'

/** 캠페인 유형 (서버 CampaignType) */
export const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
  EVENT: '이벤트',
  PROMOTION_CODE: '프로모션 코드',
  COUPON: '쿠폰',
  PARTNERSHIP: '제휴',
  AD: '광고',
}

export const campaignTypeLabel = (type: string) => CAMPAIGN_TYPE_LABEL[type] ?? type

/** 캠페인(이벤트) 목록 주소 */
export const CAMPAIGN_PATH = '/campaign'
export const CAMPAIGN_TITLE = '이벤트'

/** 캠페인 상세 주소. 유형은 주소용으로 바꾼다. (PROMOTION_CODE → promotion-code) */
export const campaignPath = (c: { type: string; _id: string }) =>
  `/campaign/${slugify(c.type)}/${c._id}`

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

// 첨부 중 배너 이미지의 flag (admin front - admin api - user front 간 약속값)
export const CAMPAIGN_BANNER_FLAG = 'banner'

/** 첨부 중 배너(flag)인 것. 대소문자는 가리지 않는다. 없으면 undefined */
export const findBannerAttach = <T extends { flag?: string | null }>(attaches: readonly T[]) =>
  attaches.find((a) => a.flag?.toLowerCase() === CAMPAIGN_BANNER_FLAG)

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

/**
 * 1인 참여 횟수 (신청 / 링크 클릭 공통). null 무제한, 0 소개 캠페인(참여·보상 없음), n 회.
 */
export const isIntroCampaign = (limit?: { availableEach?: number | null } | null) =>
  limit?.availableEach === 0
