import { ApolloError } from '@apollo/client'

/** 탈퇴 뒤 같은 계정으로 다시 가입하기까지 기다리는 기간 (안내 문구용, prod 기준) */
export const REJOIN_RESTRICT_DAYS = 30

/** 탈퇴 사유 선택지. 고른 문구를 그대로 사유로 보낸다 */
export const RESIGN_REASONS = [
  '사용 빈도가 낮아요',
  '알림이 너무 많아요',
  '원하는 콘텐츠가 없어요',
  '다른 계정으로 다시 가입할래요',
] as const
/** 직접 입력 선택지 */
export const RESIGN_REASON_OTHER = '기타(직접 입력)'
export const RESIGN_REASON_MAX_LENGTH = 500

/** 탈퇴하고 홈으로 보낼 때 붙이는 쿼리. 홈에서 '탈퇴되었습니다' 안내를 띄운다 */
export const RESIGNED_PARAM = 'resigned'

/** 탈퇴 후 재가입 제한 기간에 가입하려 할 때 오는 에러 코드 */
export const REJOIN_RESTRICTED_CODE = 'USER_REJOIN_RESTRICTED'

/** 재가입 제한 에러면 다시 가입할 수 있는 시각(rejoinAt), 아니면 undefined. 시각을 모르면 null */
export function rejoinAtOf(e: unknown): string | null | undefined {
  if (!(e instanceof ApolloError)) return undefined
  const err = e.graphQLErrors.find((g) => g.extensions?.code === REJOIN_RESTRICTED_CODE)
  if (!err) return undefined
  const detail = err.extensions?.detail as { rejoinAt?: string }[] | undefined
  return detail?.[0]?.rejoinAt ?? null
}
