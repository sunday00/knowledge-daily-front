import { useRef, type KeyboardEvent } from 'react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** 입력창 안내용 단축키 표기 */
export const SUBMIT_SHORTCUT_LABEL = isMac ? '⌘ + Enter' : 'Ctrl + Enter'

/**
 * textarea 에서 Ctrl/Cmd + Enter 로 제출. (Enter 단독은 줄바꿈)
 * 한글 조합 중에 누르면 마지막 글자가 아직 확정되지 않았으므로,
 * 조합이 끝난 뒤(입력값 반영 후) 제출한다.
 * onEscape 를 주면 Esc 로 호출한다.
 */
export function useSubmitShortcut(onSubmit: () => void, onEscape?: () => void) {
  const submitRef = useRef(onSubmit)
  submitRef.current = onSubmit
  const pendingRef = useRef(false)

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const composing = e.nativeEvent.isComposing
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (composing) pendingRef.current = true
      else submitRef.current()
    } else if (e.key === 'Escape' && onEscape && !composing) {
      onEscape()
    }
  }

  const onCompositionEnd = () => {
    if (!pendingRef.current) return
    pendingRef.current = false
    // 확정된 마지막 글자가 state 에 반영된 다음 제출
    setTimeout(() => submitRef.current(), 0)
  }

  return { onKeyDown, onCompositionEnd, 'aria-keyshortcuts': 'Control+Enter Meta+Enter' }
}
