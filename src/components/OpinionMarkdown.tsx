import { useState } from 'react'
import type { Components } from 'react-markdown'
import { CODE_RE, MarkdownLink, MarkdownView } from '@/components/MarkdownView.tsx'
import { MentionText } from '@/components/MentionText.tsx'
import { BlockedPart } from '@/components/BlockableText.tsx'
import { BLOCKED_NOTICE, splitBlocked } from '@/lib/blockedContent.ts'

// 마크다운으로 그리기 전에 @숫자 / 차단 구간을 이 주소의 링크로 바꿔 두고, 그릴 때 원래 기능으로 되돌린다.
const MENTION_HREF = '#kd-mention-'
const BLOCKED_HREF = '#kd-blocked-'

/** 코드가 아닌 구간에만 fn 을 적용 */
const outsideCode = (md: string, fn: (s: string) => string) =>
  md
    .split(CODE_RE)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('')

/**
 * 마크다운으로 바꿀 본문. 차단 구간은 자리표시 링크로 빼 두고(blocked 배열 순서), @숫자는 멘션 링크로.
 * 의견은 줄바꿈 그대로 쓰는 글이라 한 줄 바꿈도 줄바꿈으로 보이게 한다.
 */
function toMarkdown(text: string): { md: string; blocked: string[] } {
  const blocked: string[] = []
  const md = splitBlocked(text)
    .map((p) => {
      if (!p.blocked) return p.text
      blocked.push(p.text)
      return `[${BLOCKED_NOTICE}](${BLOCKED_HREF}${blocked.length - 1})`
    })
    .join('')
  return {
    md: outsideCode(md, (s) =>
      s.replace(/@(\d+)/g, `[@$1](${MENTION_HREF}$1)`).replace(/([^\n])\n(?!\n)/g, '$1  \n'),
    ),
    blocked,
  }
}

function Body({ text, className = '' }: { text: string; className?: string }) {
  const { md, blocked } = toMarkdown(text)
  const components: Components = {
    a: (props) => {
      const href = props.href ?? ''
      if (href.startsWith(MENTION_HREF)) {
        return <MentionText text={`@${href.slice(MENTION_HREF.length)}`} />
      }
      if (href.startsWith(BLOCKED_HREF)) {
        const part = blocked[Number(href.slice(BLOCKED_HREF.length))]
        return part === undefined ? null : <BlockedPart text={part} />
      }
      return <MarkdownLink {...props} />
    },
  }
  return (
    <MarkdownView
      components={components}
      // 카드 안이라 위아래 여백은 없앤다
      className={`[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className}`}
    >
      {md}
    </MarkdownView>
  )
}

/**
 * 의견 본문을 마크다운으로. @숫자는 이동 / 미리보기 링크, 차단 구간은 가려 두고 '굳이 보기' 로 펼친다.
 * 의견 전체가 차단이면 안내만 두고, 펼치면 본문 전체를 마크다운으로 흐리게 보여 준다.
 */
export function OpinionMarkdown({ text, className = '' }: { text: string; className?: string }) {
  const parts = splitBlocked(text)
  if (parts.length === 1 && parts[0].blocked) {
    return <BlockedWhole text={parts[0].text} className={className} />
  }
  return <Body text={text} className={className} />
}

function BlockedWhole({ text, className }: { text: string; className: string }) {
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
  if (!shown) {
    return (
      <p className={`text-sm italic text-neutral-400 dark:text-neutral-500 ${className}`}>
        {BLOCKED_NOTICE} {toggle}
      </p>
    )
  }
  return (
    // 펼친 뒤에도 차단 구간이었다는 걸 알 수 있게 흐리게
    <div className={`space-y-1 opacity-70 ${className}`}>
      <Body text={text} />
      {toggle}
    </div>
  )
}
