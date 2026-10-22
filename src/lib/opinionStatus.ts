// 삭제된 의견은 status=INACTIVE 로 남고, 의견 목록에선 서버가 내용을 이 값으로 가려서 준다.
export const DELETED_CONTENT = '%DELETED%'

export const isDeletedOpinion = (opinion: { status?: string | null; content: string }) =>
  opinion.status === 'INACTIVE' || opinion.content === DELETED_CONTENT
