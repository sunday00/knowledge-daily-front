type Props = {
  size?: number
  className?: string
  /** 있으면 스크린리더/툴팁용 이름으로 쓰고, 없으면 장식용으로 숨긴다. */
  label?: string
}

/** 액자 속 산과 해 (사진, 이미지 첨부) */
export function ImageIcon({ size = 20, className, label }: Props) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  )
}
