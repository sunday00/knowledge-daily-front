import { useEffect, useState } from 'react'

// 스크롤 가능한 길이의 이 비율보다 내려가면 보인다.
const SHOW_RATIO = 0.1

/** 일정 이상 내려가면 오른쪽 아래에 뜨는 맨 위로 버튼 */
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const range = document.documentElement.scrollHeight - window.innerHeight
      setVisible(range > 0 && window.scrollY > range * SHOW_RATIO)
    }
    // 스크롤 이벤트가 몰려도 한 프레임에 한 번만 계산한다.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="맨 위로"
      title="맨 위로"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      // 하단 고정 입력창이 있으면 그 위로 (--bottom-dock: OpinionComposer 가 높이를 넣는다)
      style={{ bottom: 'calc(var(--bottom-dock, 0px) + 1.25rem)' }}
      className={`fixed right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 shadow-lg backdrop-blur transition-all hover:text-brand-600 dark:hover:text-indigo-300 hover:border-brand-500 ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 4h14" />
        <path d="m6 14 6-6 6 6" />
        <path d="M12 8v12" />
      </svg>
    </button>
  )
}
