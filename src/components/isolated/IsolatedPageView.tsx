import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ISOLATED_PAGE_ONE_QUERY } from '@/graphql/queries/isolatedPage.ts'
import { CAMPAIGN_ONE_QUERY } from '@/graphql/queries/campaign.ts'
import type { IsolatedPageOneQuery } from '@/graphql/__generated__/graphql.ts'
import { hasComponent } from '@/lib/components.ts'
import { campaignPath, findBannerAttach } from '@/lib/campaign.ts'
import { isolatedPagePath } from '@/lib/isolatedPage.ts'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { SenseItem } from '@/components/SenseItem.tsx'
import { MySenseButton } from '@/components/MySenseButton.tsx'
import { CampaignImage } from '@/components/campaign/CampaignImage.tsx'
import { ApplicableBlock, LinkButtons } from '@/components/campaign/CampaignOneView.tsx'

export type IsolatedPageItem = IsolatedPageOneQuery['IsolatedPageQuery']['isolatedPageOne']['item']
type PageChild = IsolatedPageItem['items'][number]
type Child<T extends PageChild['__typename']> = Extract<PageChild, { __typename: T }>

/** 페이지에 붙일 기능. 관리자가 페이지마다 components 로 고른다. (대소문자 무시) */
export const hasPageComponent = (item: IsolatedPageItem, name: 'Reaction' | 'Opinion') =>
  hasComponent(item.components, name)

/** 페이지에 대화록을 달 때의 원글 */
export const isolatedPageTarget = (item: IsolatedPageItem): OpinionTarget => ({
  entity: 'IsolatedPage',
  id: item._id,
  path: isolatedPagePath(item),
})

/**
 * 독립 페이지 한 건 (/page/:slug).
 * 머리(배너가 있으면 배너가 제목 대신) → 아이템들을 sortKey 순으로 세로로 → 링크 → (reaction 이면) 리액션 줄.
 * 그 아래 내용(대화록 등)은 children 으로.
 */
export function IsolatedPageView({
  children,
}: {
  children?: (item: IsolatedPageItem) => ReactNode
}) {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data, loading, error } = useQuery(ISOLATED_PAGE_ONE_QUERY, {
    variables: { input: { slug } },
    fetchPolicy: 'cache-and-network',
  })
  const res = data?.IsolatedPageQuery.isolatedPageOne
  const item = res?.success ? res.item : null
  // 서버가 sortKey 순으로 주지만 한 번 더 맞춘다
  const items = item ? [...item.items].sort((a, z) => a.sortKey - z.sortKey) : []

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div className={`space-y-8 ${item && hasPageComponent(item, 'Opinion') ? 'pb-32' : ''}`}>
      <article className="space-y-6">
        {loading && !res && <LoadingSpinner />}
        {((error && !res) || (res && !item)) && (
          <p className="text-neutral-500">페이지를 찾을 수 없습니다.</p>
        )}

        {item && (
          <>
            <PageHeader item={item} />
            {items.map((child, i) => (
              <PageChildBlock key={`${child.__typename}:${child.sortKey}:${i}`} item={child} />
            ))}
            {item.links.length > 0 && <LinkButtons links={item.links} />}
            {hasPageComponent(item, 'Reaction') && (
              <ReactionBar target={{ entity: 'IsolatedPage', id: item._id }} />
            )}
          </>
        )}
      </article>

      {item && children?.(item)}
    </div>
  )
}

/** 배너(flag banner)가 있으면 배너가 제목을 대신한다. (제목은 스크린리더용으로 남긴다) */
function PageHeader({ item }: { item: IsolatedPageItem }) {
  const banner = findBannerAttach(item.attaches)?.attach
  if (banner) {
    return (
      <header>
        <h2 className="sr-only">{item.title}</h2>
        <CampaignImage attach={banner} alt={item.title} eager className="rounded-lg" />
      </header>
    )
  }
  return (
    <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
      <h2 className="text-2xl font-semibold break-words">{item.title}</h2>
      {item.subTitle && (
        <p className="text-lg text-neutral-600 dark:text-neutral-300">{item.subTitle}</p>
      )}
    </header>
  )
}

function PageChildBlock({ item }: { item: PageChild }) {
  switch (item.__typename) {
    case 'IsolatedPageTextItem':
      return <TextBlock item={item} />
    case 'IsolatedPageAttachItem':
      return <AttachBlock item={item} />
    case 'IsolatedPageSenseItem':
      return <SenseBlock item={item} />
    case 'IsolatedPageApplicableItem':
      return <ApplicableItemBlock item={item} />
    default:
      return null
  }
}

const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//')

/** 마크다운. href 가 있으면 블록 전체가 링크 (사이트 안은 라우터, 바깥은 새 탭) */
function TextBlock({ item }: { item: Child<'IsolatedPageTextItem'> }) {
  if (!item.href) return <MarkdownView>{item.content}</MarkdownView>
  const className =
    'block rounded-lg border border-brand-500 px-4 py-3 text-brand-700 dark:text-indigo-300 no-underline transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10'
  const body = (
    <span className="flex items-center justify-between gap-3">
      <span className="min-w-0">
        <MarkdownView>{item.content}</MarkdownView>
      </span>
      <span aria-hidden className="shrink-0">
        →
      </span>
    </span>
  )
  return isInternal(item.href) ? (
    <Link to={item.href} className={className}>
      {body}
    </Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  )
}

/** 첨부(이미지)들을 sortKey 순으로 → 그 아래 설명(마크다운) */
function AttachBlock({ item }: { item: Child<'IsolatedPageAttachItem'> }) {
  const attaches = [...item.attaches].sort((a, z) => a.sortKey - z.sortKey)
  return (
    <section className="space-y-3">
      {attaches.map(({ attach }) => (
        <CampaignImage key={attach._id} attach={attach} alt="" className="rounded-lg" />
      ))}
      {item.content && <MarkdownView>{item.content}</MarkdownView>}
    </section>
  )
}

/** 상식 카드 목록. 홈 목록처럼 내 상식 추가 버튼을 둔다 */
function SenseBlock({ item }: { item: Child<'IsolatedPageSenseItem'> }) {
  if (item.senses.length === 0) return null
  return (
    <ul className="space-y-3">
      {item.senses.map((s) => (
        <SenseItem key={s._id} item={s} action={<MySenseButton senseId={s._id} mode="add" />} />
      ))}
    </ul>
  )
}

/**
 * 참여형 캠페인. 기간·상태 판단에 상위 캠페인이 필요해 상위 캠페인을 받아 이벤트 상세와 같은 응모 블록을 그린다.
 * (응모 후 CAMPAIGN_ONE_QUERY 를 다시 받으므로 참여 정보도 함께 갱신된다)
 */
function ApplicableItemBlock({ item }: { item: Child<'IsolatedPageApplicableItem'> }) {
  const parentId = item.campaign.campaign
  const { data, loading } = useQuery(CAMPAIGN_ONE_QUERY, {
    variables: { input: { _id: parentId } },
    fetchPolicy: 'cache-and-network',
    context: { expectedErrorCodes: ['CAMPAIGN_NOT_FOUND'] },
  })
  const res = data?.CampaignQuery.campaignOne
  const parent = res?.success ? res.item : null
  const applicable = parent?.items.find(
    (c): c is Extract<typeof c, { __typename: 'ApplicableCampaign' }> =>
      c.__typename === 'ApplicableCampaign' && c._id === item.campaign._id,
  )

  if (loading && !res) return <LoadingSpinner size="sm" />
  // 상위 캠페인이 노출 대상이 아니면 조용히 뺀다
  if (!parent || !applicable) return null
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <Link to={campaignPath(parent)} className="font-semibold text-brand-600">
          {parent.title}
        </Link>
        {parent.subTitle && <span className="ml-2 text-neutral-500">{parent.subTitle}</span>}
      </p>
      <ApplicableBlock parent={parent} item={applicable} />
    </div>
  )
}
