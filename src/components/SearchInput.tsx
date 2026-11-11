import type { InputHTMLAttributes } from 'react'
import { SearchIcon } from './SearchIcon'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** 아이콘과 입력칸을 감싸는 요소의 class (flex 안에서 늘릴 때 등) */
  wrapperClassName?: string
}

/** 검색 입력칸. 왼쪽 끝에 돋보기 아이콘을 둔다. (className 은 input 에, 왼쪽 여백 pl-9 포함해서) */
export function SearchInput({ wrapperClassName = '', className = '', ...props }: Props) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input type="search" className={className} {...props} />
    </div>
  )
}
