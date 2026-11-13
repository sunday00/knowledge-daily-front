// 서버는 입력의 <script> 태그 꺾쇠를 &lt; &gt; 로 바꿔 저장한다 (InputSanitizeInterceptor).
// 화면은 React 텍스트 / react-markdown(raw HTML 미허용)으로만 그려서 < > 가 HTML 로 실행되지 않으므로,
// 받은 값을 < > 로 되돌려 보여 준다. (안 그러면 일반 텍스트에 &lt;script&gt; 가 그대로 보인다)
const ANGLE = /&(lt|gt);/g

/** 문자열의 &lt; &gt; 를 < > 로 */
export function decodeAngles(value: string): string {
  return value.includes('&')
    ? value.replace(ANGLE, (_, k: string) => (k === 'lt' ? '<' : '>'))
    : value
}

/** 응답 데이터 안의 모든 문자열에 decodeAngles. 바뀐 게 없으면 같은 객체를 돌려준다 */
export function decodeAnglesDeep<T>(value: T): T {
  if (typeof value === 'string') return decodeAngles(value) as T
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((v) => {
      const d = decodeAnglesDeep(v)
      if (d !== v) changed = true
      return d
    })
    return (changed ? next : value) as T
  }
  if (value && typeof value === 'object') {
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const d = decodeAnglesDeep(v)
      if (d !== v) changed = true
      next[k] = d
    }
    return (changed ? next : value) as T
  }
  return value
}
