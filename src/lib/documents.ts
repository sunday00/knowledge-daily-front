// 개인정보처리방침, 이용약관, 소개 등 문서. 하단 링크와 sitemap(vite-plugins/sitemap.ts)이 같이 쓴다.

/** 문서 주소. 백엔드 Document.slug 와 맞춘다. */
export const documentPath = (slug: string) => `/documents/${slug}`

export const DOCUMENTS = [
  // 개인정보처리방침은 다른 링크보다 눈에 띄게 둔다.
  { slug: 'privacy', label: '개인정보처리방침', strong: true },
  { slug: 'terms', label: '이용약관', strong: false },
  { slug: 'about', label: 'About', strong: false },
] as const
