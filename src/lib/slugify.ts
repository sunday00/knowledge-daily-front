/**
 * 제목을 주소용 문자열로. 카멜케이스는 단어로 나누고(AskTag → ask-tag, HTMLParser → html-parser),
 * 소문자, 공백/밑줄은 -, 글자·숫자·- 외 문자는 뺀다. (한글 유지)
 */
export function slugify(title: string): string {
  return title
    .trim()
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1-$2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1-$2')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
