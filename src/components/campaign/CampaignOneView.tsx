import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { CAMPAIGN_ONE_QUERY } from '@/graphql/queries/campaign.ts'
import type { CampaignOneQuery } from '@/graphql/__generated__/graphql.ts'
import { hasComponent } from '@/lib/components.ts'
import {
  CAMPAIGN_PATH,
  CAMPAIGN_TITLE,
  campaignPath,
  campaignTypeLabel,
  findBannerAttach,
  isClosedCampaign,
  isIntroCampaign,
  maxText,
  periodText,
} from '@/lib/campaign.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useCampaignApply, type ApplyState } from '@/actions/campaignApply.ts'
import { useClickPoint } from '@/actions/clickPoint.ts'
import { Modal, ModalButton, ModalSpinner } from '@/components/Modal.tsx'
import { BackToList } from '@/components/BackToList.tsx'

export type CampaignOneItem = CampaignOneQuery['CampaignQuery']['campaignOne']['item']
type ApplyLimit = NonNullable<CampaignOneItem['applyLimit']>

const NOT_FOUND = 'CAMPAIGN_NOT_FOUND'

/** 캠페인에 붙일 기능. 관리자가 캠페인마다 components 로 고른다. */
export const hasCampaignComponent = (item: CampaignOneItem, name: 'Reaction' | 'Opinion') =>
  hasComponent(item.components, name)

/** 캠페인에 대화록을 달 때의 원글 */
export const campaignTarget = (item: CampaignOneItem): OpinionTarget => ({
  entity: 'Campaign',
  id: item._id,
  path: campaignPath(item),
})

/**
 * 캠페인 한 건: 유형, 제목/부제, 기간, (있으면) 첨부 배너, 본문(마크다운), 참여 안내, (reaction 이면) 리액션 줄.
 * 그 아래 내용(대화록 등)은 children 으로.
 */
export function CampaignOneView({ children }: { children?: (item: CampaignOneItem) => ReactNode }) {
  const { type = '', id = '' } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data, loading, error } = useQuery(CAMPAIGN_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
    // 없거나 시작 전인 캠페인은 에러로 오지만 화면에서 안내하므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: [NOT_FOUND] },
  })
  const res = data?.CampaignQuery.campaignOne
  const item = res?.success ? res.item : null

  // 주소의 유형이 실제와 다르면(유형이 바뀌었거나 잘못 들어옴) 맞는 주소로 바꾼다.
  const canonical = item && campaignPath(item)
  useEffect(() => {
    if (!canonical || canonical.split('/')[2] === type) return
    // /campaign/:type/:id 뒤(대화 주소 등)는 그대로 둔다.
    const rest = pathname.split('/').slice(4).join('/')
    navigate(rest ? `${canonical}/${rest}` : canonical, { replace: true })
  }, [canonical, type, pathname, navigate])

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div className={`space-y-8 ${item && hasCampaignComponent(item, 'Opinion') ? 'pb-32' : ''}`}>
      <article className="space-y-6">
        {/* 목록에서 왔으면 보던 페이지(?page=)로 돌아간다. 배너 등으로 바로 왔으면 이벤트 목록 */}
        <BackToList fallback={CAMPAIGN_PATH}>{CAMPAIGN_TITLE} 목록</BackToList>
        {loading && !res && <LoadingSpinner />}
        {((error && !res) || (res && !item)) && (
          <p className="text-neutral-500">캠페인을 찾을 수 없습니다.</p>
        )}

        {item && (
          <>
            <CampaignHeader item={item} />
            <CampaignBanner item={item} />
            <MarkdownView>{item.content}</MarkdownView>
            <CampaignLinks item={item} />
            {/* 참여형만. 소개 캠페인(1인 0회)은 참여·보상이 없다. */}
            {item.applyLimit &&
              item.applyLimit.available !== 0 &&
              !isIntroCampaign(item.applyLimit) && (
                <ApplyInfo item={item} limit={item.applyLimit} />
              )}
            {hasCampaignComponent(item, 'Reaction') && (
              <ReactionBar target={{ entity: 'Campaign', id: item._id }} />
            )}
          </>
        )}
      </article>

      {item && children?.(item)}
    </div>
  )
}

function CampaignHeader({ item }: { item: CampaignOneItem }) {
  const ended = isClosedCampaign(item)
  return (
    <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded px-1.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
          {campaignTypeLabel(item.type)}
        </span>
        {ended ? (
          <span className="rounded px-1.5 py-0.5 bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
            종료
          </span>
        ) : (
          <span className="rounded px-1.5 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            진행 중
          </span>
        )}
      </div>
      <h2 className="text-2xl font-semibold break-words">{item.title}</h2>
      {item.subTitle && (
        <p className="text-lg text-neutral-600 dark:text-neutral-300">{item.subTitle}</p>
      )}
      <p className="text-sm text-neutral-500">
        <span className="mr-2">기간</span>
        {periodText(item.startAt, item.endAt)}
      </p>
    </header>
  )
}

/** 첨부 중 배너(flag) 이미지. 없으면 아무것도 안 그린다. */
function CampaignBanner({ item }: { item: CampaignOneItem }) {
  const attach = findBannerAttach(item.attaches)?.attach
  if (!attach) return null
  const src = (attach.src ?? {}) as Record<string, string>
  const srcSet = attach.elements
    .filter((el) => src[el.name] && el.size[0])
    .map((el) => `${src[el.name]} ${el.size[0]}w`)
    .join(', ')
  return (
    <SafeImage
      src={src.full ?? src.preview ?? Object.values(src)[0]}
      srcSet={srcSet || undefined}
      sizes="(min-width: 1024px) 976px, 100vw"
      alt={item.title}
      className={`w-full rounded-lg ${isClosedCampaign(item) ? 'grayscale' : ''}`}
    />
  )
}

const MY_STATUS: Record<string, string> = {
  APPLY: '참여함',
  WIN: '당첨',
  SUB: '예비 당첨',
}

/** 참여형 캠페인의 참여 조건 + 응모하기 */
function ApplyInfo({ item, limit }: { item: CampaignOneItem; limit: ApplyLimit }) {
  const rows: [string, ReactNode][] = [
    ['참여 기간', periodText(limit.startAt, limit.endAt)],
    ['참여 인원', limit.available == null ? '제한 없음' : `${limit.available.toLocaleString()}명`],
    ['참여 포인트', limit.cost > 0 ? `${limit.cost.toLocaleString()}P` : '무료'],
    [
      '당첨 인원',
      `${limit.win.toLocaleString()}명${limit.sub ? ` (예비 ${limit.sub.toLocaleString()}명)` : ''}`,
    ],
  ]
  rows.push([
    '1인 참여',
    limit.availableEach == null ? '제한 없음' : `${limit.availableEach.toLocaleString()}회`,
  ])
  if (item.maxes.length > 0) rows.push(['참여 간격', item.maxes.map(maxText).join(', ')])
  if (limit.announceAt) rows.push(['당첨 발표', formatDateTime(limit.announceAt)])
  const mine = MY_STATUS[limit.me]
  if (mine) rows.push(['내 참여', mine])

  return (
    <section className="space-y-3">
      <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 px-4 py-2.5">
            <dt className="w-24 shrink-0 text-neutral-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ApplyButton item={item} limit={limit} />
    </section>
  )
}

const inPeriod = (from: unknown, to: unknown, now = Date.now()) =>
  (from == null || Date.parse(from as string) <= now) &&
  (to == null || now <= Date.parse(to as string))

/** 응모하기. 로그인, 응모 기간, 내 참여 여부를 보고 누를 수 있게 한다. (자세한 검증은 서버) */
function ApplyButton({ item, limit }: { item: CampaignOneItem; limit: ApplyLimit }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { apply, state, busy, reset } = useCampaignApply()
  const [confirming, setConfirming] = useState(false)

  // 응모 기간이 따로 없으면 캠페인 기간
  const open =
    !isClosedCampaign(item) && inPeriod(limit.startAt ?? item.startAt, limit.endAt ?? item.endAt)
  // 한 번 참여해 봤는지. 1인 1회일 때만 버튼을 막고, 나머지는 응모해 보고 서버 사유로 안내한다.
  const triedOnce = limit.me !== 'NONE'
  const applied = triedOnce && limit.availableEach === 1

  const handleSubmit = (e: FormEvent) => {
    // 바로 응모하지 않는다. 확인 → (결과 받을 연결 → 응모 → 결과) 순서는 useCampaignApply
    e.preventDefault()
    if (!busy) setConfirming(true)
  }

  const handleConfirm = () => {
    setConfirming(false)
    void apply(item._id, limit.cost)
  }

  if (!user) {
    return (
      <p className="text-sm text-neutral-500">
        응모하려면{' '}
        <Link to="/login" state={{ from: pathname }} className="text-brand-600">
          로그인
        </Link>
        하세요.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={busy || applied || !open}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60 disabled:hover:bg-brand-600"
      >
        {applied
          ? '응모 완료'
          : !open
            ? '응모 기간이 아닙니다'
            : `${triedOnce ? '한 번 더 응모하기' : '응모하기'}${
                limit.cost > 0 ? ` (${limit.cost.toLocaleString()}P)` : ''
              }`}
      </button>

      <ApplyConfirmModal
        open={confirming}
        title={item.title}
        cost={limit.cost}
        onCancel={() => setConfirming(false)}
        onConfirm={handleConfirm}
      />
      <ApplyProgressModal state={state} onClose={reset} />
    </form>
  )
}

/** 응모 전 확인. 포인트가 있으면 차감·환불 불가를 알린다. */
function ApplyConfirmModal({
  open,
  title,
  cost,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  cost: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      tone={cost > 0 ? 'warning' : 'default'}
      icon={cost > 0 ? undefined : <span className="text-2xl">🎁</span>}
      title={cost > 0 ? `${cost.toLocaleString()}P 를 사용해 응모할까요?` : '응모할까요?'}
      footer={
        <>
          <ModalButton onClick={onCancel}>취소</ModalButton>
          <ModalButton variant="primary" onClick={onConfirm} autoFocus>
            응모하기
          </ModalButton>
        </>
      }
    >
      <p className="font-medium text-neutral-800 dark:text-neutral-100">{title}</p>
      {cost > 0 && (
        <p className="mt-2">
          응모하면 포인트가 바로 차감되며,
          <br />
          응모 후에는 취소·환불되지 않습니다.
        </p>
      )}
    </Modal>
  )
}

const PROGRESS_TEXT: Record<string, string> = {
  connecting: '응모 준비 중...',
  applying: '응모를 보내는 중...',
  waiting: '포인트 차감 결과를 기다리는 중...',
}

/** 응모 진행(닫을 수 없음) → 결과. 결과를 확인하면 닫힌다. */
function ApplyProgressModal({ state, onClose }: { state: ApplyState; onClose: () => void }) {
  if (state.step === 'idle') return <Modal open={false} onClose={onClose} title="" />

  if (state.step === 'done' || state.step === 'error') {
    const ok = state.step === 'done'
    return (
      <Modal
        open
        onClose={onClose}
        tone={ok ? 'success' : 'danger'}
        title={ok ? '응모 완료!' : '응모하지 못했습니다'}
        footer={
          <ModalButton variant="primary" onClick={onClose} autoFocus>
            확인
          </ModalButton>
        }
      >
        {state.message}
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} dismissible={false} icon={<ModalSpinner />} title="응모 중입니다">
      <p role="status" aria-live="polite">
        {PROGRESS_TEXT[state.step]}
      </p>
      <p className="mt-1 text-xs text-neutral-500">창을 닫지 말고 잠시만 기다려 주세요.</p>
    </Modal>
  )
}

/**
 * 캠페인 링크 (더 알아보기 등). 포인트 링크(point > 0)면 누를 때 클릭 보상을 보낸다.
 * 보상 응답은 기다리지 않고 바로 이동한다. 바깥 주소는 새 탭으로 열려 결과 안내가 이 화면에 남는다.
 */
function CampaignLinks({ item }: { item: CampaignOneItem }) {
  const { user } = useAuth()
  const { click, notice } = useClickPoint()
  if (item.links.length === 0) return null
  // 소개 캠페인, 닫힌 캠페인은 보상이 없다.
  const rewardable = !isIntroCampaign(item.applyLimit) && !isClosedCampaign(item)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {item.links.map((link) => {
          const point = rewardable && link.point && link.point > 0 ? link.point : 0
          const onClick = () => {
            if (user && point > 0) click(item._id, link.key, point)
          }
          const className =
            'inline-flex items-center gap-2 rounded-md border border-brand-500 px-4 py-2 font-semibold text-brand-700 dark:text-indigo-300 no-underline transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10'
          const content = (
            <>
              {link.label || link.key}
              {point > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  +{point.toLocaleString()}P
                </span>
              )}
            </>
          )
          const internal = link.href.startsWith('/') && !link.href.startsWith('//')
          return internal ? (
            <Link key={link.key} to={link.href} onClick={onClick} className={className}>
              {content}
            </Link>
          ) : (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClick}
              className={className}
            >
              {content}
            </a>
          )
        })}
      </div>
      {!user && rewardable && item.links.some((l) => (l.point ?? 0) > 0) && (
        <p className="text-xs text-neutral-500">로그인하고 누르면 포인트를 받을 수 있어요.</p>
      )}
      {notice && (
        <p
          role="status"
          className={`text-sm ${notice.ok ? 'text-green-700 dark:text-green-400' : 'text-neutral-500'}`}
        >
          {notice.message}
        </p>
      )}
    </div>
  )
}
