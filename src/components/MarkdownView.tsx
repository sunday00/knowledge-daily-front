import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SafeImage } from '@/components/SafeImage.tsx'

// 원시 HTML 은 렌더링하지 않는다 (react-markdown 기본값). 외부 링크는 새 탭으로.
const components: Components = {
  a: ({ node: _node, href, ...props }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} />
    )
  },
  // 유실되거나 주소가 깨진 이미지는 대체 그림으로
  img: ({ node: _node, ...props }) => (
    <SafeImage loading="lazy" className="rounded-md" {...props} />
  ),
}

// 코드 블록/인라인 코드는 엔티티가 그대로 보이므로 건드리지 않는다.
const CODE_RE = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g

// remark-gfm 은 ~ 하나짜리 짝도 취소선으로 처리한다 (예: 1995~1996 … 2007~2021).
// 단독 ~ 는 &#126; 로 바꿔 문자 그대로 보이게 하고, ~~ 취소선은 유지한다.
function escapeSingleTilde(md: string) {
  return md
    .split(CODE_RE)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/(?<!~)~(?!~)/g, '&#126;')))
    .join('')
}

export function MarkdownView({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <div className={`prose prose-neutral dark:prose-invert max-w-none break-words ${className}`}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {escapeSingleTilde(children)}
      </Markdown>
    </div>
  )
}
