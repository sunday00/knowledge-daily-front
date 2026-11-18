// 신고 사유. 서버엔 code 로 보낸다 (quest = 'code|상세내용')
export const REPORT_REASONS = [
  { code: 'spam', label: '스팸·도배' },
  { code: 'noAuthAdv', label: '무단 광고' },
  { code: 'abuse', label: '욕설·비하' },
  { code: 'fake', label: '허위 정보' },
  { code: 'obscene', label: '음란·불쾌한 내용' },
  { code: 'privacy', label: '개인정보 노출' },
  { code: 'etc', label: '기타' },
] as const

export type ReportReasonCode = (typeof REPORT_REASONS)[number]['code']

export const REPORT_QUEST_SEPARATOR = '|'

/**
 * 서버로 보낼 신고 내용. 상세 내용이 없어도 구분자는 붙인다.
 * 첫 '|' 앞이 코드, 뒤가 상세 내용 (상세 내용 안의 '|' 는 그대로 둔다)
 * 예) 'spam|' , 'fake|출처가 없는 수치입니다'
 */
export const toReportQuest = (code: ReportReasonCode, detail: string) =>
  `${code}${REPORT_QUEST_SEPARATOR}${detail.trim()}`

/** 신고 내용(quest)을 사유 이름과 상세 내용으로. 모르는 코드면 코드 그대로 */
export function parseReportQuest(quest: string): { label: string; detail: string } {
  const at = quest.indexOf(REPORT_QUEST_SEPARATOR)
  const code = at < 0 ? quest : quest.slice(0, at)
  const detail = at < 0 ? '' : quest.slice(at + 1)
  return { label: REPORT_REASONS.find((r) => r.code === code)?.label ?? code, detail }
}
