import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { CAMPAIGN_LIST_QUERY } from '@/graphql/queries/campaign.ts'
import type { CampaignListByQry, CampaignListQuery } from '@/graphql/__generated__/graphql.ts'
import {
  campaignColor,
  campaignPath,
  campaignItemLabels,
  findBannerAttach,
  hasCampaignResult,
  isCampaignInProgress,
  isClosedCampaign,
  periodText,
} from '@/lib/campaign.ts'
import { Pagination, PAGE_PARAM, usePageParam } from '@/components/Pagination.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { SearchInput } from '@/components/SearchInput.tsx'

type CampaignListItem = CampaignListQuery['CampaignQuery']['campaignStandardList']['items'][number]

const PAGE_SIZE = 12
// 배너 크기 정보가 없을 때의 비율 (가로:세로)
const DEFAULT_RATIO = '5 / 2'

const TAB_PARAM = 'tab'
const KEYWORD_PARAM = 'q'
const TABS = [
  { key: 'active', label: '활성 이벤트' },
  { key: 'ended', label: '종료 이벤트' },
] as const
type Tab = (typeof TABS)[number]['key']

/** 정규식 특수문자를 글자 그대로 찾도록 (서버 contains 는 정규식) */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 탭과 검색어로 목록 조건을 만든다. 서버가 status 를 기간으로 유추한다.
 * - 활성(ACTIVE): ACTIVE 이고 아직 안 끝난 것
 * - 종료(CLOSE): CLOSE 이거나, ACTIVE 여도 끝난 것 (응답 status 도 CLOSE 로 온다)
 * - 검색어: 제목 또는 부제에 포함
 * (complex 는 JSON 값이라 쿼리 변수로 보내야 한다. 지금처럼 variables 로)
 */
function listInput(tab: Tab, keyword: string, page: number): CampaignListByQry {
  const contains = keyword ? escapeRegex(keyword) : null
  return {
    size: PAGE_SIZE,
    page,
    // 활성은 마감 임박순 (서버는 sortKey 를 먼저 보고 그다음 이 정렬)
    ...(tab === 'active' && { sort: { endAt: 1 } }),
    search: {
      status: { eq: tab === 'active' ? 'ACTIVE' : 'CLOSE' },
      ...(contains && {
        title: { contains },
        subTitle: { contains },
        complex: { or: ['title', 'subTitle'] },
      }),
    },
  }
}

/**
 * 이벤트(캠페인) 목록: 활성 / 종료 탭 + 제목·부제 검색. 그 안에서 sortKey 순 (서버 정렬).
 * 배너(flag) 첨부가 있으면 배너로, 없으면 캠페인마다 정해진 색 배경에 제목.
 * 기한이 지났거나 닫힌(CLOSE) 캠페인은 흑백으로.
 * 탭(?tab=)과 검색어(?q=)는 주소에 둬서 새 탭 열기·공유·뒤로가기가 그대로 된다.
 */
export function CampaignList() {
  const page = usePageParam()
  const [params] = useSearchParams()
  const tab: Tab = params.get(TAB_PARAM) === 'ended' ? 'ended' : 'active'
  const keyword = params.get(KEYWORD_PARAM)?.trim() ?? ''

  const { data, previousData, loading, error } = useQuery(CAMPAIGN_LIST_QUERY, {
    variables: { input: listInput(tab, keyword, page) },
    fetchPolicy: 'cache-and-network',
  })
  // 페이지를 옮기는 동안엔 이전 페이지를 그대로 두어 화면이 비지 않게 한다.
  const res = (data ?? previousData)?.CampaignQuery.campaignStandardList
  const maxPage = res?.maxPage || Math.ceil((res?.total ?? 0) / PAGE_SIZE)
  const items = res?.items ?? []

  const empty = keyword
    ? `'${keyword}' 에 맞는 이벤트가 없습니다.`
    : page > 1
      ? '이 페이지에는 이벤트가 없습니다.'
      : tab === 'active'
        ? '지금 진행 중인 이벤트가 없습니다.'
        : '종료된 이벤트가 없습니다.'

  return (
    <div className="space-y-4">
      <ListTabs current={tab} />
      <SearchForm keyword={keyword} />

      <div className={`space-y-4 ${loading && res ? 'opacity-60' : ''}`}>
        {res?.success && (
          <p className="text-sm text-neutral-500">총 {(res.total ?? 0).toLocaleString()}개</p>
        )}
        {loading && !res && <LoadingSpinner />}
        {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
        {res && !res.success && (
          <p className="text-red-600 dark:text-red-400">
            {res.message ?? '서버가 실패를 반환했습니다.'}
          </p>
        )}

        {res?.success ? (
          items.length === 0 ? (
            <p className="text-neutral-500">{empty}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <CampaignCard key={item._id} item={item} closed={isClosedCampaign(item)} />
              ))}
            </ul>
          )
        ) : null}

        {res?.success ? <Pagination page={page} maxPage={Math.max(maxPage, page)} /> : null}
      </div>
    </div>
  )
}

/** 활성 / 종료 탭. 검색어는 두고 페이지는 1로 */
function ListTabs({ current }: { current: Tab }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()

  return (
    <nav
      aria-label="이벤트 상태"
      className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
    >
      {TABS.map((t) => {
        const next = new URLSearchParams(params)
        next.delete(PAGE_PARAM)
        if (t.key === 'active') next.delete(TAB_PARAM)
        else next.set(TAB_PARAM, t.key)
        const qs = next.toString()
        const active = t.key === current
        return (
          <Link
            key={t.key}
            to={qs ? `${pathname}?${qs}` : pathname}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm no-underline transition-colors ${
              active
                ? 'border-brand-600 font-medium text-brand-600 dark:border-indigo-300 dark:text-indigo-300'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** 제목·부제 검색. 탭은 두고 페이지는 1로. 비우고 검색하면 검색 해제 */
function SearchForm({ keyword }: { keyword: string }) {
  const [params, setParams] = useSearchParams()
  const [value, setValue] = useState(keyword)
  // 뒤로가기 등으로 주소가 바뀌면 입력칸도 맞춘다.
  useEffect(() => setValue(keyword), [keyword])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    next.delete(PAGE_PARAM)
    const q = value.trim()
    if (q) next.set(KEYWORD_PARAM, q)
    else next.delete(KEYWORD_PARAM)
    setParams(next)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex gap-2">
      <SearchInput
        wrapperClassName="min-w-0 flex-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="이벤트 제목, 부제로 검색"
        aria-label="이벤트 검색"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 py-1.5 text-sm outline-none focus:border-brand-500"
      />
      <button type="submit" className="btn text-sm">
        검색
      </button>
    </form>
  )
}

function CampaignCard({ item, closed }: { item: CampaignListItem; closed: boolean }) {
  const banner = findBannerAttach(item.attaches)?.attach
  // 참여형 아이템 중 하나라도 내가 참여했으면 (참여 인원은 아이템마다 달라 카드엔 안 둔다)
  const applied = item.items.some((c) => c.__typename === 'ApplicableCampaign' && c.me !== 'NONE')
  const location = useLocation()

  return (
    <li>
      <Link
        to={campaignPath(item)}
        // 상세의 목록 버튼이 보던 페이지로 돌아가도록
        state={{ from: location.pathname + location.search }}
        className={`group block overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 no-underline text-inherit transition-shadow hover:shadow-md ${
          closed ? 'grayscale' : ''
        }`}
      >
        {banner ? (
          <BannerImage attach={banner} alt={item.title} />
        ) : (
          // 배너가 없으면 색 배경에 제목
          <div
            className="flex items-center justify-center px-6 text-center text-white"
            style={{ aspectRatio: DEFAULT_RATIO, background: campaignColor(item._id) }}
          >
            <span className="text-xl font-bold leading-tight break-words drop-shadow sm:text-2xl">
              {item.title}
            </span>
          </div>
        )}

        <div className="space-y-1.5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {campaignItemLabels(item.items).map((label) => (
              <span
                key={label}
                className="rounded px-1.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
              >
                {label}
              </span>
            ))}
            {hasCampaignResult(item) && (
              <span className="rounded px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                결과 발표
              </span>
            )}
            {/* 노출 기간이 남아도 하위 아이템 기간이 다 끝났으면 진행 중이 아니다 */}
            {!closed && isCampaignInProgress(item) ? (
              <span className="rounded px-1.5 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                진행 중
              </span>
            ) : (
              <span className="rounded px-1.5 py-0.5 bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                종료
              </span>
            )}
            {applied && (
              <span className="rounded px-1.5 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                참여함
              </span>
            )}
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 dark:group-hover:text-indigo-300 truncate">
            {item.title}
          </p>
          {item.subTitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {item.subTitle}
            </p>
          )}
          <p className="text-xs text-neutral-500">{periodText(item.startAt, item.endAt)}</p>
        </div>
      </Link>
    </li>
  )
}

type Attach = NonNullable<
  ReturnType<typeof findBannerAttach<CampaignListItem['attaches'][number]>>
>['attach']

function BannerImage({ attach, alt }: { attach: Attach; alt: string }) {
  const src = (attach.src ?? {}) as Record<string, string>
  const els = attach.elements
  const [w, h] = (els.find((el) => el.name === 'full') ?? els[0])?.size ?? []
  // 카드 폭은 화면 절반 정도라 preview 크기로도 충분하다.
  const srcSet = els
    .filter((el) => src[el.name] && el.size[0])
    .map((el) => `${src[el.name]} ${el.size[0]}w`)
    .join(', ')
  return (
    <SafeImage
      src={src.preview ?? src.full ?? Object.values(src)[0]}
      srcSet={srcSet || undefined}
      sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
      alt={alt}
      loading="lazy"
      className="block w-full object-cover"
      style={{ aspectRatio: w && h ? `${w} / ${h}` : DEFAULT_RATIO }}
    />
  )
}
