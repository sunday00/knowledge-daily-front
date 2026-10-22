// 의견 말머리. value 는 Opinion.type 으로 서버에 저장된다. ('' = 말머리 없음 → 보내지 않음)
export const OPINION_TYPES = [
  { value: '', label: '말머리 없음' },
  { value: 'supplement', label: '내용보충' },
  { value: 'objection', label: '이의제기' },
  { value: 'level', label: '레벨조정' },
  { value: 'exclude', label: '제외요청' },
  { value: 'source', label: '출처보충' },
  { value: 'chat', label: '잡담' },
  { value: 'etc', label: '기타' },
] as const

export type OpinionType = (typeof OPINION_TYPES)[number]['value']
