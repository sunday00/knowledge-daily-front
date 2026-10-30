import type { CSSProperties } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SafeImage } from '@/components/SafeImage.tsx'

/**
 * 이미지 주소 뒤 #w=..&ratio=..&align=.. 로 표시 방법을 정한다. (admin front - admin api - user front 간 약속값)
 * - w: 최대 가로(px). 화면이 더 좁으면 줄어든다.
 * - ratio: 가로/세로. 이 비율로 가운데를 잘라 보여준다. 없으면 원본 비율.
 * - align: left | center | right. 없으면 기본 배치. left/right 는 float 으로 글이 그림 옆을 감싸 흐른다.
 * 잘못된 값은 무시한다. 세로는 비율로 정해지므로 모바일에서 가로가 줄어도 비율이 유지된다.
 */
function imageStyleOf(src: string): CSSProperties | undefined {
  const hash = src.split('#')[1]
  if (!hash) return undefined
  const q = new URLSearchParams(hash)
  const w = Number(q.get('w'))
  const ratio = q.get('ratio')?.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  const align = q.get('align')
  const float = align === 'left' || align === 'right'
  return {
    width: w > 0 ? `${w}px` : undefined,
    // 옆으로 글이 흐를 자리를 남기도록 float 그림은 본문 폭의 절반까지만
    maxWidth: float ? '50%' : '100%',
    aspectRatio: ratio ? `${ratio[1]} / ${ratio[2]}` : undefined,
    objectFit: ratio ? 'cover' : undefined,
    ...(float
      ? {
          float: align,
          marginTop: '0.25em',
          marginBottom: '0.75em',
          // 글 쪽으로만 여백
          marginLeft: align === 'right' ? '1.25em' : 0,
          marginRight: align === 'left' ? '1.25em' : 0,
        }
      : align === 'center'
        ? { display: 'block', marginLeft: 'auto', marginRight: 'auto' }
        : {}),
  }
}

// 원시 HTML 은 렌더링하지 않는다 (react-markdown 기본값). 외부 링크는 새 탭으로.
const components: Components = {
  a: ({ node: _node, href, ...props }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} />
    )
  },
  // 유실되거나 주소가 깨진 이미지는 대체 그림으로. #w=..&ratio=..&align=.. 로 크기·비율·정렬
  img: ({ node: _node, src = '', ...props }) => (
    <SafeImage
      loading="lazy"
      className="rounded-md"
      style={imageStyleOf(src)}
      src={src}
      {...props}
    />
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
    // flow-root: 끝에 걸친 float 그림이 본문 밖(리액션 줄 등)으로 넘치지 않게 감싼다.
    <div
      className={`prose prose-neutral dark:prose-invert max-w-none break-words flow-root ${className}`}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {escapeSingleTilde(children)}
      </Markdown>
    </div>
  )
}
