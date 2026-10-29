/**
 * 의견(대화록)을 다는 원글. 상식(Sense)과 문의/요청 글(Ask)에 쓴다.
 * path 는 원글 페이지 주소로, 대화 페이지는 `${path}/threads/:threadId`.
 */
export type OpinionTarget = { entity: 'Sense' | 'Ask'; id: string; path: string }

export const threadPath = (targetPath: string, threadId: string) =>
  `${targetPath}/threads/${threadId}`
