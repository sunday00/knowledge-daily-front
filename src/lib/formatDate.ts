/** 'YYYY. M. D. 오후 h:mm' 형태 (ko-KR) */
export const formatDateTime = (value: unknown) =>
  new Date(value as string).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
