import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 원시 HTML 은 렌더링하지 않는다 (react-markdown 기본값). 외부 링크는 새 탭으로.
const components: Components = {
  a: ({ node: _node, href, ...props }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} />
    )
  },
  img: ({ node: _node, ...props }) => <img loading="lazy" className="rounded-md" {...props} />,
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
        {children}
      </Markdown>
    </div>
  )
}
