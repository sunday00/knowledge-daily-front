import { useLayoutEffect, useRef } from 'react'

/** 내용에 맞춰 textarea 높이를 늘린다 (maxHeight 이상은 안에서 스크롤) */
export function useAutoResizeTextarea(value: string, maxHeight = 160) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [value, maxHeight])

  return ref
}
