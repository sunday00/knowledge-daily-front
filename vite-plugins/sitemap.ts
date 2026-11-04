import type { Plugin } from 'vite'
import { DOCUMENTS, documentPath } from '../src/lib/documents.ts'
import { slugify } from '../src/lib/slugify.ts'

/**
 * 검색엔진용 /sitemap.xml 과 /robots.txt.
 * 주소가 환경마다 달라(VITE_SITE_URL) 빌드할 때 만들고, 개발 서버에서도 같은 내용을 돌려준다.
 *
 * 넣는 주소: 로그인 없이 볼 수 있는 고정 페이지 + 공용 설정(sharedConfigs.boards)의 게시판 목록
 * + 이벤트(캠페인) 상세. 이벤트는 개수가 적고 진행 중 안내가 중요해 상세까지 넣는다.
 * 상식/글/공지 상세는 개수가 계속 늘어 여기서 다 담지 않는다. (목록 페이지에서 링크로 찾아간다)
 * 로그인해야 쓰는 화면(개인설정, 내 상식, 글쓰기 등)은 robots.txt 에서 막는다.
 */

type Entry = { path: string; changefreq: 'daily' | 'weekly' | 'monthly'; priority: number }

const STATIC_ENTRIES: Entry[] = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/tags', changefreq: 'daily', priority: 0.8 },
  { path: '/board/notice', changefreq: 'weekly', priority: 0.6 },
  { path: '/campaign', changefreq: 'weekly', priority: 0.6 },
  ...DOCUMENTS.map(({ slug }) => ({
    path: documentPath(slug),
    changefreq: 'monthly' as const,
    priority: 0.3,
  })),
]

// 로그인해야 쓰는 화면, 로그인 처리 주소
const DISALLOW = [
  '/login',
  '/auth/',
  '/user/',
  '/sense/my-sense',
  '/board/*/write',
  '/board/*/edit',
]

type BoardConfig = { title: string }
type SharedConfigs = { version?: string; boards?: Record<string, BoardConfig[] | undefined> }

async function graphql<T>(endpoint: string, query: string, version?: string): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 공용 설정 버전이 다르면 서버가 요청을 받지 않는다. (src/lib/sharedConfigs.ts)
      ...(version ? { 'X-Shared-Configs-Version': version } : {}),
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(5000),
  })
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (!body.data) throw new Error(body.errors?.map((e) => e.message).join(', ') ?? 'no data')
  return body.data
}

/** 공용 설정. 서버에 못 붙으면 null */
async function fetchSharedConfigs(
  endpoint: string,
  warn: (msg: string) => void,
): Promise<SharedConfigs | null> {
  try {
    const data = await graphql<{ SystemQuery: { sharedConfigs: { item: unknown } } }>(
      endpoint,
      '{ SystemQuery { sharedConfigs { item } } }',
    )
    return (data.SystemQuery.sharedConfigs.item as SharedConfigs | null) ?? null
  } catch (e) {
    warn(`[sitemap] 공용 설정을 못 받아 게시판·이벤트는 빼고 만듭니다: ${(e as Error).message}`)
    return null
  }
}

/** 공용 설정의 게시판 주소 */
function boardEntries(configs: SharedConfigs): Entry[] {
  const boards = configs.boards ?? {}
  // src/lib/boards.ts 의 listBoards 와 같은 키
  const list = [...(boards.articles ?? boards.article ?? []), ...(boards.ask ?? [])]
  return list.map((b) => ({
    path: `/board/${slugify(b.title)}`,
    changefreq: 'daily',
    priority: 0.6,
  }))
}

type CampaignRow = { _id: string; type: string; status: string; endAt: string }

const CAMPAIGN_PAGE_SIZE = 100
const CAMPAIGN_MAX_PAGES = 20
// src/lib/campaign.ts 와 같은 기준: 2200년 이후 끝은 무기한
const NO_END_FROM = Date.UTC(2200, 0, 1)

/**
 * 이벤트 상세 주소 (진행 중 + 끝난 것). 주소 규칙은 src/lib/campaign.ts campaignPath 와 같다.
 * 진행 중이면 자주, 끝났거나 닫혔으면(CLOSE) 드물게 다시 보도록 한다. 못 받으면 빼고 만든다.
 */
async function fetchCampaignEntries(
  endpoint: string,
  version: string | undefined,
  warn: (msg: string) => void,
): Promise<Entry[]> {
  const rows: CampaignRow[] = []
  try {
    for (let page = 1; page <= CAMPAIGN_MAX_PAGES; page++) {
      const data = await graphql<{
        CampaignQuery: { campaignStandardList: { items: CampaignRow[]; maxPage?: number | null } }
      }>(
        endpoint,
        `{ CampaignQuery { campaignStandardList(input: { size: ${CAMPAIGN_PAGE_SIZE}, page: ${page}, search: { status: { mul: [ACTIVE, CLOSE] } } }) { maxPage items { _id type status endAt } } } }`,
        version,
      )
      const { items, maxPage } = data.CampaignQuery.campaignStandardList
      rows.push(...items)
      if (items.length < CAMPAIGN_PAGE_SIZE || (maxPage && page >= maxPage)) break
    }
  } catch (e) {
    warn(`[sitemap] 이벤트 목록을 못 받아 빼고 만듭니다: ${(e as Error).message}`)
    return []
  }
  const now = Date.now()
  return rows.map((c) => {
    const end = Date.parse(c.endAt)
    const closed = c.status === 'CLOSE' || (end < NO_END_FROM && end < now)
    return {
      path: `/campaign/${slugify(c.type)}/${c._id}`,
      changefreq: closed ? 'monthly' : 'weekly',
      priority: closed ? 0.2 : 0.5,
    }
  })
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function toSitemapXml(siteUrl: string, entries: Entry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(new URL(encodeURI(e.path), siteUrl).href)}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function toRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Allow: /
${DISALLOW.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${new URL('/sitemap.xml', siteUrl).href}
`
}

export function sitemap({ siteUrl, endpoint }: { siteUrl: string; endpoint: string }): Plugin {
  const build = async (warn: (msg: string) => void) => {
    const configs = await fetchSharedConfigs(endpoint, warn)
    const boards = configs ? boardEntries(configs) : []
    const campaigns = configs ? await fetchCampaignEntries(endpoint, configs.version, warn) : []
    // 같은 주소가 겹치면 한 번만 (공지사항이 게시판 목록에 들어 있어도)
    const seen = new Set<string>()
    const entries = [...STATIC_ENTRIES, ...boards, ...campaigns].filter(
      (e) => !seen.has(e.path) && seen.add(e.path),
    )
    return { xml: toSitemapXml(siteUrl, entries), robots: toRobotsTxt(siteUrl) }
  }

  return {
    name: 'knowledge-daily-sitemap',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/sitemap.xml' && path !== '/robots.txt') return next()
        const { xml, robots } = await build((m) => server.config.logger.warn(m))
        res.setHeader(
          'Content-Type',
          path === '/sitemap.xml' ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8',
        )
        res.end(path === '/sitemap.xml' ? xml : robots)
      })
    },
    async generateBundle() {
      const { xml, robots } = await build((m) => this.warn(m))
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}
