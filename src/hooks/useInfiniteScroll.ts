import { useEffect, useRef } from 'react'

/**
 * 반환된 ref 를 목록 끝의 요소에 달면, 그 요소가 화면 가까이(rootMargin) 들어올 때 onReach 를 부른다.
 * enabled 가 false 면 관찰하지 않는다. (다음 페이지 없음 / 이미 불러오는 중)
 */
export function useInfiniteScroll<T extends Element>(
  onReach: () => void,
  enabled: boolean,
  rootMargin = '200px',
) {
  const ref = useRef<T>(null)
  const onReachRef = useRef(onReach)
  onReachRef.current = onReach

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onReachRef.current()
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return ref
}
