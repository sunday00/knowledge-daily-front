// 코드 블록/인라인 코드 안의 #은 태그로 보지 않는다. (MarkdownView 와 같은 기준)
const CODE_RE = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g
// 줄 처음이나 공백 뒤의 #단어. 글자·숫자·_ 만 (한글 포함). "# 제목" 같은 마크다운 헤더는 # 뒤가 공백이라 빠진다.
const HASHTAG_RE = /(?:^|\s)#([\p{L}\p{N}_]+)/gu

export const HASHTAG_MAX_LENGTH = 30

/** 본문의 #태그 목록 (나온 순서, 중복 제거, 너무 긴 건 제외) */
export function extractHashtags(text: string): string[] {
  const plain = text.replace(CODE_RE, ' ')
  const names = Array.from(plain.matchAll(HASHTAG_RE), (m) => m[1]).filter(
    (name) => name.length <= HASHTAG_MAX_LENGTH && !/^\d+$/.test(name),
  )
  return [...new Set(names)]
}
