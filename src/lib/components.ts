/**
 * 글에 붙일 기능(components)이 있는지. 서버 약속값이 엔티티마다 대소문자가 달라
 * (게시판 글: 'Reaction', 공지: 'reaction') 대소문자를 가리지 않고 본다.
 */
export const hasComponent = (components: readonly string[] | null | undefined, name: string) =>
  !!components?.some((c) => c.toLowerCase() === name.toLowerCase())
