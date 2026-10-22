// 상식 상세 → 대화록 상세를 오가도 "목록으로" 가 처음 들어온 목록(홈 / 내 Knowledge 등)으로 돌아가도록
// 카드를 누른 목록 주소를 탭 단위(sessionStorage)로 기억한다. 새로고침해도 유지된다.
const KEY = 'knowledge-daily:senseListReturn'
const FALLBACK = '/'

export function rememberSenseListPath(path: string): void {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // ignore
  }
}

export function senseListPath(): string {
  try {
    return sessionStorage.getItem(KEY) ?? FALLBACK
  } catch {
    return FALLBACK
  }
}
