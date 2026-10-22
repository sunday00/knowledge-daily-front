type Props = {
  size?: number
  className?: string
  /** 있으면 스크린리더/툴팁용 이름으로 쓰고, 없으면 장식용으로 숨긴다. */
  label?: string
}

/** 좌우로 주고받는 두 개의 말풍선 (대화) */
export function ChatIcon({ size = 20, className, label }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {label && <title>{label}</title>}
      <path d="M4 2h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-3 3v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M11 11h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v3l-3-3h-5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
    </svg>
  )
}
