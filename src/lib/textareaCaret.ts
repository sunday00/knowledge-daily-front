// textarea 안 글자 위치(index)의 화면 좌표를 구한다. (같은 스타일의 숨은 div 에 글자를 그려 재는 방식)
const COPIED = [
  'box-sizing',
  'width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-style',
  'font-variant',
  'font-weight',
  'font-stretch',
  'font-size',
  'line-height',
  'font-family',
  'letter-spacing',
  'word-spacing',
  'text-indent',
  'text-transform',
  'tab-size',
]

/** textarea 기준(왼쪽 위 테두리 바깥) 좌표. 스크롤을 반영한다 */
export function textareaCaretCoords(el: HTMLTextAreaElement, index: number) {
  const cs = getComputedStyle(el)
  const mirror = document.createElement('div')
  for (const prop of COPIED) mirror.style.setProperty(prop, cs.getPropertyValue(prop))
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.overflowWrap = 'break-word'
  mirror.textContent = el.value.slice(0, index)

  const marker = document.createElement('span')
  marker.textContent = el.value.slice(index) || '.'
  mirror.appendChild(marker)
  document.body.appendChild(mirror)
  // offsetTop/Left 은 테두리 안쪽 기준이라 테두리 두께를 더한다
  const top = marker.offsetTop + parseFloat(cs.borderTopWidth) - el.scrollTop
  const left = marker.offsetLeft + parseFloat(cs.borderLeftWidth) - el.scrollLeft
  document.body.removeChild(mirror)
  return { top, left }
}
