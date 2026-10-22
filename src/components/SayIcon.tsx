type Props = {
  size?: number
  className?: string
  /** 있으면 스크린리더/툴팁용 이름으로 쓰고, 없으면 장식용으로 숨긴다. */
  label?: string
}

/** 'abc' 글자가 들어간 말풍선 (의견) */
export function SayIcon({ size = 20, className, label }: Props) {
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
      <path d="M5 3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-8l-5 4v-4H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
      <text
        x="12"
        y="10.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="currentColor"
        stroke="none"
      >
        abc
      </text>
    </svg>
  )
}
