type Props = {
  size?: number
  className?: string
}

/** 불꽃 (인기) */
export function FlameIcon({ size = 20, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3c.5 3-2 4.5-3.5 6.5S6.5 13 6.5 15a5.5 5.5 0 0 0 11 0c0-2.5-1.5-4.5-2.5-5.5-.3 1.5-1 2.5-2 3 .5-2.5-.2-6.5-1-9.5Z" />
    </svg>
  )
}
