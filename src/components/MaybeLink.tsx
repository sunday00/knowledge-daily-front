import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

/**
 * disabled 면 링크 대신 같은 모양의 div (목록에서 차단 / 삭제된 항목은 상세로 가지 않는다).
 * 누를 수 없다는 게 보이게 hover 효과는 뺀다.
 */
export function MaybeLink({
  disabled,
  className = '',
  children,
  ...props
}: LinkProps & { disabled: boolean; children: ReactNode }) {
  if (disabled) {
    const still = className
      .split(/\s+/)
      .filter((c) => !c.includes('hover:'))
      .join(' ')
    return (
      <div aria-disabled="true" className={still}>
        {children}
      </div>
    )
  }
  return (
    <Link className={className} {...props}>
      {children}
    </Link>
  )
}
