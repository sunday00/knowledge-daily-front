import { maskedNoticeOf } from '@/lib/blockedContent.ts'

/**
 * 목록의 제목 / 내용. 서버가 삭제 / 차단으로 가린 값이면 '삭제된 글입니다.' / '차단된 글입니다.' 처럼 흐리게.
 * 목록 카드는 전체가 링크라 '굳이 보기' 없이 안내만 한다 (의견 대화록 카드와 같다).
 */
export function MaskedText({
  value,
  noun,
  className = '',
}: {
  value: string
  /** 안내 문구의 대상 ('글', '퀴즈' 등) */
  noun: string
  className?: string
}) {
  const notice = maskedNoticeOf(value, noun)
  if (notice) {
    return (
      <span className={`font-normal italic text-neutral-400 dark:text-neutral-500 ${className}`}>
        {notice}
      </span>
    )
  }
  return <span className={className}>{value}</span>
}
