import { Fragment, useState } from 'react'
import { BLOCKED_NOTICE, splitBlocked } from '@/lib/blockedContent.ts'
import { MentionText } from '@/components/MentionText.tsx'

/**
 * 의견 본문. 차단 구간(%BLOCKED<% … %>BLOCKED%)은 가려 두고
 * '굳이 보기' / '다시 숨기기' 로 그 구간만 펼치고 접는다. 일반 구간의 @숫자는 링크.
 * <p> 안에 들어가므로 span/button 만 쓴다.
 */
export function BlockableText({ text }: { text: string }) {
  return (
    <>
      {splitBlocked(text).map((part, i) =>
        part.blocked ? (
          <BlockedPart key={i} text={part.text} />
        ) : (
          <Fragment key={i}>
            <MentionText text={part.text} />
          </Fragment>
        ),
      )}
    </>
  )
}

function BlockedPart({ text }: { text: string }) {
  const [shown, setShown] = useState(false)

  const toggle = (
    <button
      type="button"
      onClick={() => setShown((v) => !v)}
      aria-expanded={shown}
      className="text-sm not-italic text-neutral-400 underline underline-offset-2 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
    >
      {shown ? '다시 숨기기' : '굳이 보기'}
    </button>
  )

  if (shown) {
    // 펼친 뒤에도 차단 구간이었다는 걸 알 수 있게 흐리게
    return (
      <span className="text-neutral-500 dark:text-neutral-400">
        <MentionText text={text} /> {toggle}
      </span>
    )
  }
  return (
    <span className="text-sm italic text-neutral-400 dark:text-neutral-500">
      {BLOCKED_NOTICE} {toggle}
    </span>
  )
}
