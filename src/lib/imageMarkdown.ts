/** 올라간 이미지를 본문용 마크다운으로: ![파일이름](full 주소). 주소가 없으면 빈 문자열 */
export function imageMarkdown({ name, src }: { name: string; src: Record<string, string> }) {
  const url = src.full ?? Object.values(src)[0]
  if (!url) return ''
  // 대체 텍스트는 확장자를 빼고, 마크다운을 깨는 대괄호/줄바꿈은 정리한다.
  const alt = name
    .replace(/\.[^.]+$/, '')
    .replace(/[[\]\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return `![${alt}](${url})`
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 본문에서 주어진 주소의 이미지 마크다운 ![...](url) 을 지운다.
 * 그 이미지만 있던 줄은 줄째로 지우고, 글 중간에 있던 건 이미지 부분만 뺀다.
 */
export function removeImageMarkdown(text: string, urls: string[]): string {
  return urls.reduce((acc, url) => {
    const img = `!\\[[^\\]\\n]*\\]\\(${escapeRe(url)}(?:\\s+"[^"]*")?\\)`
    return acc
      .replace(new RegExp(`^[ \\t]*${img}[ \\t]*(?:\\r?\\n|$)`, 'gm'), '')
      .replace(new RegExp(img, 'g'), '')
  }, text)
}
