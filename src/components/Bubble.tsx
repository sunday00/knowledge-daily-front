import type { CSSProperties, ReactNode } from 'react'

type Props = {
  id?: string
  role?: 'tooltip' | 'status'
  /** 위치/보이기 등 추가 클래스 */
  className?: string
  style?: CSSProperties
  /** 꼬리의 왼쪽 위치(px). 기본 12 */
  tailLeft?: number
  children: ReactNode
}

/**
 * 아래쪽에 꼬리가 달린 말풍선. 기준 요소 위에 absolute 로 띄운다.
 * <p> 안에서도 쓰이므로 span 으로만 만든다.
 */
export function Bubble({ id, role, className = '', style, tailLeft = 12, children }: Props) {
  return (
    <span
      id={id}
      role={role}
      style={style}
      className={`absolute z-30 block w-72 max-w-[80vw] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-left text-sm font-normal shadow-lg ${className}`}
    >
      {children}
      <span
        aria-hidden
        style={{ left: tailLeft }}
        className="absolute top-full -mt-1 block h-2 w-2 rotate-45 border-b border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
      />
    </span>
  )
}
