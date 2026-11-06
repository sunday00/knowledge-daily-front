/** 독립 페이지 주소. slug 로 식별 */
export const ISOLATED_PAGE_PATH = '/page'
export const isolatedPagePath = (p: { slug: string }) =>
  `${ISOLATED_PAGE_PATH}/${encodeURIComponent(p.slug)}`
