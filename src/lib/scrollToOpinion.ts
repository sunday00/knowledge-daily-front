/** 목록에서 의견 카드의 DOM id */
export const opinionDomId = (opinionId: string) => `opinion-${opinionId}`

/**
 * 해당 의견 카드를 화면 가운데로 스크롤한다.
 * 목록이 막 갱신된 직후라 아직 그려지지 않았을 수 있어 몇 프레임 기다려 본다.
 */
export function scrollToOpinion(opinionId: string, tries = 30): void {
  const el = document.getElementById(opinionDomId(opinionId))
  if (!el) {
    if (tries > 0) requestAnimationFrame(() => scrollToOpinion(opinionId, tries - 1))
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
