type Props = {
  /** 스피너 옆에 보일 문구 */
  label?: string
  /** sm: 사이드 목록·더 불러오기 등 좁은 자리, md: 섹션 본문 */
  size?: 'sm' | 'md'
  className?: string
}

/** 컴포넌트 단위 로딩 표시. 섹션마다 따로 두어 먼저 받은 곳부터 보이게 한다. */
export function LoadingSpinner({ label = '불러오는 중...', size = 'md', className = '' }: Props) {
  const sm = size === 'sm'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 ${
        sm ? 'py-2 text-sm' : 'py-6'
      } ${className}`}
    >
      <span
        aria-hidden
        className={`shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${
          sm ? 'h-4 w-4' : 'h-5 w-5'
        }`}
      />
      <span>{label}</span>
    </div>
  )
}
