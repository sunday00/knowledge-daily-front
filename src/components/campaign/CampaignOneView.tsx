import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { CAMPAIGN_ONE_QUERY } from '@/graphql/queries/campaign.ts'
import type { CampaignOneQuery } from '@/graphql/__generated__/graphql.ts'
import { hasComponent } from '@/lib/components.ts'
import {
  CAMPAIGN_CONTENT_FLAG,
  CAMPAIGN_ITEM_CARD_FLAG,
  CAMPAIGN_PATH,
  CAMPAIGN_TITLE,
  campaignItemLabel,
  campaignItemLabels,
  campaignPath,
  filterAttachByFlag,
  findAttachByFlag,
  findBannerAttach,
  hasCampaignResult,
  isCampaignInProgress,
  isClosedCampaign,
  isItemOpen,
  maxText,
  periodText,
} from '@/lib/campaign.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useCampaignApply, type ApplyState } from '@/actions/campaignApply.ts'
import { useClickPoint, type ClickNotice } from '@/actions/clickPoint.ts'
import { Modal, ModalButton, ModalSpinner } from '@/components/Modal.tsx'
import { BackToList } from '@/components/BackToList.tsx'
import { CampaignImage } from '@/components/campaign/CampaignImage.tsx'

export type CampaignOneItem = CampaignOneQuery['CampaignQuery']['campaignOne']['item']
type CampaignChild = CampaignOneItem['items'][number]
export type ApplicableItem = Extract<CampaignChild, { __typename: 'ApplicableCampaign' }>
type ReadableItem = Extract<CampaignChild, { __typename: 'ReadableCampaign' }>
type CampaignLink = CampaignOneItem['links'][number]

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
 * 캠페인 한 건 (/campaign/:id).
 * 헤더(아이템 유형, 진행 상태, 제목/부제, 기간) → 배너 → 안내 이미지(content) → 본문 → 링크
 * → 하위 아이템(참여형 응모 / 읽기형 보기 보상) → (reaction 이면) 리액션 줄.
 * 그 아래 내용(대화록 등)은 children 으로.
 */
export function CampaignOneView({ children }: { children?: (item: CampaignOneItem) => ReactNode }) {
  const { id = '' } = useParams<{ id: string }>()
  const { data, loading, error } = useQuery(CAMPAIGN_ONE_QUERY, {
    variables: { input: { _id: id } },
    fetchPolicy: 'cache-and-network',
    // 없거나 시작 전인 캠페인은 에러로 오지만 화면에서 안내하므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: [NOT_FOUND] },
  })
  const res = data?.CampaignQuery.campaignOne
  const item = res?.success ? res.item : null

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div
      className={`mx-auto max-w-2xl space-y-8 ${item && hasCampaignComponent(item, 'Opinion') ? 'pb-32' : ''}`}
    >
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
            <CampaignTopImages item={item} />
            <MarkdownView>{item.content}</MarkdownView>
            <ParentLinks item={item} />
            {item.items.map((child) =>
              child.__typename === 'ApplicableCampaign' ? (
                <ApplicableBlock key={child._id} parent={item} item={child} />
              ) : (
                <ReadableBlock key={child._id} parent={item} item={child} />
              ),
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

const badge = 'rounded px-1.5 py-0.5'
const brandBadge = `${badge} bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200`
const endedBadge = `${badge} bg-neutral-100 text-neutral-500 dark:bg-neutral-800`
const liveBadge = `${badge} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400`
const resultBadge = `${badge} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`

function CampaignHeader({ item }: { item: CampaignOneItem }) {
  const live = isCampaignInProgress(item)
  return (
    <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {campaignItemLabels(item.items).map((label) => (
          <span key={label} className={brandBadge}>
            {label}
          </span>
        ))}
        {hasCampaignResult(item) && <span className={resultBadge}>결과 발표</span>}
        {/* 노출 기간이 남아도 하위 아이템 기간이 다 끝났으면 진행 중이 아니다 */}
        <span className={live ? liveBadge : endedBadge}>{live ? '진행 중' : '종료'}</span>
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

/** 상단 배너(banner) + 안내 이미지(content, 세로로 긴 기간·참여 방법·경품 안내). 본문 위에 전체 폭으로 */
function CampaignTopImages({ item }: { item: CampaignOneItem }) {
  const banner = findBannerAttach(item.attaches)?.attach
  const contents = filterAttachByFlag(item.attaches, CAMPAIGN_CONTENT_FLAG)
  if (!banner && contents.length === 0) return null
  const gray = isClosedCampaign(item) ? 'grayscale' : ''
  return (
    <div className="space-y-4">
      {banner && (
        <CampaignImage attach={banner} alt={item.title} eager className={`rounded-lg ${gray}`} />
      )}
      {contents.map(({ attach }, i) => (
        <CampaignImage
          key={attach._id}
          attach={attach}
          alt={`${item.title} 안내${contents.length > 1 ? ` ${i + 1}` : ''}`}
          className={`rounded-lg ${gray}`}
        />
      ))}
    </div>
  )
}

/** 하위 아이템 블록 공통 틀: 카드 이미지(card) → 유형·제목줄 → 내용 */
function ItemBlock({
  parent,
  item,
  open,
  children,
}: {
  parent: CampaignOneItem
  item: CampaignChild
  open: boolean
  children: ReactNode
}) {
  const card = findAttachByFlag(item.attaches, CAMPAIGN_ITEM_CARD_FLAG)?.attach
  const label = campaignItemLabel(item)
  // 아이템에 따로 기간이 있으면 보여 준다. 없으면 상위 기간과 같다.
  const ownPeriod = item.startAt != null || item.endAt != null
  return (
    <section
      aria-label={label}
      className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      {card && (
        <CampaignImage
          attach={card}
          alt={`${parent.title} ${label}`}
          sizes="(min-width: 1024px) 976px, 100vw"
          className={open ? '' : 'grayscale'}
        />
      )}
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={brandBadge}>{label}</span>
          {item.status === 'RESULT' ? (
            <span className={resultBadge}>결과 발표</span>
          ) : (
            !open && <span className={endedBadge}>지금은 참여할 수 없어요</span>
          )}
          {ownPeriod && (
            <span className="text-neutral-500">
              {periodText(item.startAt ?? parent.startAt, item.endAt ?? parent.endAt)}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

/** 정보 표 (참여 조건 등) */
function InfoRows({ rows }: { rows: [string, ReactNode][] }) {
  if (rows.length === 0) return null
  return (
    <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 px-4 py-2.5">
          <dt className="w-24 shrink-0 text-neutral-500">{label}</dt>
          <dd className="min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const MY_STATUS: Record<string, string> = {
  APPLY: '참여함',
  WIN: '당첨',
  SUB: '예비 당첨',
}

/** 경품 목록. RANK 면 수상명(1등 등) 순서, 포인트 추첨이면 포인트 금액 */
function Rewards({ item }: { item: ApplicableItem }) {
  const rewards = [...item.winnerSetting.rewards].sort((a, z) => a.sortKey - z.sortKey)
  if (rewards.length === 0) return null
  const point = item.applicableSubType === 'LOTTERY_POINT'
  return (
    <ul className="space-y-0.5">
      {rewards.map((r) => (
        <li key={r.key}>
          {r.rewardLabel && <span className="mr-1.5 font-medium">{r.rewardLabel}</span>}
          {point && r.rewardAmount != null
            ? `${r.rewardAmount.toLocaleString()}P`
            : r.rewardProduct}
          {!point && r.rewardAmount != null && (
            <span className="text-neutral-500"> × {r.rewardAmount.toLocaleString()}</span>
          )}
          {/* 순위형은 순위마다 tie 명 (없으면 1명) */}
          {item.winnerSetting.winType === 'RANK' && (
            <span className="text-neutral-500"> · {(r.tie ?? 1).toLocaleString()}명</span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** 참여형 아이템: 조건 표 + 응모하기. 독립 페이지에서도 쓴다. */
export function ApplicableBlock({
  parent,
  item,
}: {
  parent: CampaignOneItem
  item: ApplicableItem
}) {
  // 지원자 수 / 1인 횟수가 0 이면 참여 불가
  const blocked = item.available === 0 || item.availableEach === 0
  const open = isItemOpen(item, parent) && !blocked
  const { win, sub } = item.winnerSetting

  const rows: [string, ReactNode][] = [
    ['참여 포인트', item.cost > 0 ? `${item.cost.toLocaleString()}P` : '무료'],
    [
      '1인 참여',
      item.availableEach == null ? '제한 없음' : `${item.availableEach.toLocaleString()}회`,
    ],
    [
      '참여 인원',
      `${item.appliedCnt.toLocaleString()}명${
        item.available == null ? '' : ` / ${item.available.toLocaleString()}명`
      }`,
    ],
    ['당첨 인원', `${win.toLocaleString()}명${sub ? ` (예비 ${sub.toLocaleString()}명)` : ''}`],
  ]
  if (item.winnerSetting.rewards.length > 0) rows.push(['경품', <Rewards item={item} />])
  if (item.announceAt) rows.push(['당첨 발표', formatDateTime(item.announceAt)])
  const mine = MY_STATUS[item.me]
  if (mine) rows.push(['내 참여', mine])
  const result = item.status === 'RESULT'

  return (
    <ItemBlock parent={parent} item={item} open={open}>
      <InfoRows rows={rows} />
      {item.links.length > 0 && <LinkButtons links={item.links} />}
      {/* 결과 발표 후엔 응모 대신 당첨 결과 */}
      {result ? (
        <WinnerResult item={item} />
      ) : (
        !blocked && <ApplyButton parent={parent} item={item} open={open} />
      )}
    </ItemBlock>
  )
}

type Winner = ApplicableItem['winners'][number]

/** 예비 순번. 서버 subRank(decimal 문자열)가 정수면 그대로, 아니면 목록 순서로 */
const subRankOf = (w: Winner, subs: Winner[], i = subs.findIndex((s) => s._id === w._id)) => {
  const n = Number(w.subRank)
  return Number.isInteger(n) && n > 0 ? n : i + 1
}

/** 당첨 결과 (status RESULT). 경품(순위)별 당첨자 → 예비 당첨자. 내 이름은 강조 */
function WinnerResult({ item }: { item: ApplicableItem }) {
  const { user } = useAuth()
  const winners = item.winners.filter((w) => w.applyStatus === 'WIN')
  // 예비 당첨은 서버가 순번(subRank) 순으로 준다
  const subs = item.winners.filter((w) => w.applyStatus === 'SUB')

  // 당첨자를 경품(winRank = reward key)별로. 경품에 없는 key 는 '당첨' 하나로 모은다.
  const rewards = [...item.winnerSetting.rewards].sort((a, z) => a.sortKey - z.sortKey)
  const groups = rewards
    .map((r) => ({
      key: r.key,
      label: r.rewardLabel || '당첨',
      product: r.rewardProduct,
      winners: winners.filter((w) => w.winRank === r.key),
    }))
    .filter((g) => g.winners.length > 0)
  const known = new Set(rewards.map((r) => r.key))
  const etc = winners.filter((w) => !w.winRank || !known.has(w.winRank))
  if (etc.length > 0) groups.push({ key: '', label: '당첨', product: '', winners: etc })

  // 내 결과: 당첨자 목록에 내가 있는지로 본다. (목록에 없으면 내 신청 상태 me 로)
  const myWin = user && item.winners.find((w) => w.user?._id === user.userId)
  const myStatus = myWin?.applyStatus ?? item.me
  const myReward = myWin?.winRank ? rewards.find((r) => r.key === myWin.winRank) : undefined
  const myResult =
    myStatus === 'WIN'
      ? `축하합니다! ${myReward?.rewardLabel ? `${myReward.rewardLabel}에 ` : ''}당첨되었습니다.${
          myReward?.rewardProduct ? ` (${myReward.rewardProduct})` : ''
        }`
      : myStatus === 'SUB'
        ? `예비 당첨되었습니다.${myWin ? ` (예비 ${subRankOf(myWin, subs)}번)` : ''}`
        : null

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">당첨 결과</h4>
      {myResult && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {myResult}
        </p>
      )}
      {groups.length === 0 && subs.length === 0 ? (
        <p className="text-sm text-neutral-500">당첨자가 없습니다.</p>
      ) : (
        <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
          {groups.map((g) => (
            <WinnerRow
              key={`win:${g.key}`}
              label={g.label}
              sub={g.product}
              winners={g.winners}
              me={user?.userId}
            />
          ))}
          {subs.length > 0 && (
            <WinnerRow label="예비 당첨" winners={subs} me={user?.userId} ordered />
          )}
        </dl>
      )}
    </div>
  )
}

function WinnerRow({
  label,
  sub,
  winners,
  me,
  ordered,
}: {
  label: string
  sub?: string
  winners: Winner[]
  me?: string
  ordered?: boolean
}) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-24 shrink-0 text-neutral-500">
        {label}
        {sub && <span className="block text-xs">{sub}</span>}
      </dt>
      <dd className="min-w-0">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {winners.map((w, i) => {
            const mine = !!me && w.user?._id === me
            return (
              <li
                key={w._id}
                className={
                  mine
                    ? 'rounded bg-amber-100 px-1.5 font-semibold text-amber-800 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-700'
                    : undefined
                }
              >
                {ordered && (
                  <span className="mr-1 text-neutral-500">{subRankOf(w, winners, i)}.</span>
                )}
                {w.user?.nickname ?? '(알 수 없음)'}
                {mine && <span className="ml-1 text-xs">(나)</span>}
              </li>
            )
          })}
        </ul>
      </dd>
    </div>
  )
}

/** 응모하기. 로그인, 응모 가능 여부, 내 참여 여부를 보고 누를 수 있게 한다. (자세한 검증은 서버) */
function ApplyButton({
  parent,
  item,
  open,
}: {
  parent: CampaignOneItem
  item: ApplicableItem
  open: boolean
}) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { apply, state, busy, reset } = useCampaignApply()
  const [confirming, setConfirming] = useState(false)

  // 한 번 참여해 봤는지. 1인 1회일 때만 버튼을 막고, 나머지는 응모해 보고 서버 사유로 안내한다.
  const triedOnce = item.me !== 'NONE'
  const applied = triedOnce && item.availableEach === 1
  // 처음 참여하는 사람은 지원자 수가 차면 막는다. (이미 참여한 사람은 횟수 안에서 더 응모할 수 있다)
  const full = !triedOnce && item.available != null && item.appliedCnt >= item.available

  const handleSubmit = (e: FormEvent) => {
    // 바로 응모하지 않는다. 확인 → (결과 받을 연결 → 응모 → 결과) 순서는 useCampaignApply
    e.preventDefault()
    if (!busy) setConfirming(true)
  }

  const handleConfirm = () => {
    setConfirming(false)
    void apply(item._id, item.cost)
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
        disabled={busy || applied || full || !open}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60 disabled:hover:bg-brand-600"
      >
        {applied
          ? '응모 완료'
          : !open
            ? '응모 기간이 아닙니다'
            : full
              ? '응모 마감'
              : `${triedOnce ? '한 번 더 응모하기' : '응모하기'}${
                  item.cost > 0 ? ` (${item.cost.toLocaleString()}P)` : ''
                }`}
      </button>

      <ApplyConfirmModal
        open={confirming}
        title={`${parent.title} · ${campaignItemLabel(item)}`}
        cost={item.cost}
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

/** 링크 하나에 걸린 클릭 보상 (보상을 주는 읽기형 아이템 + 포인트) */
type Reward = { readableId: string; point: number }

/** 이 링크를 누르면 보상을 주는 읽기형 아이템. 지금 동작하는 것만 */
function rewardFor(
  parent: CampaignOneItem,
  link: CampaignLink,
  only?: ReadableItem,
): Reward | null {
  const readables = only
    ? [only]
    : parent.items.filter((c): c is ReadableItem => c.__typename === 'ReadableCampaign')
  const r = readables.find((c) => c.clickLinkEvent?.linkKey === link.key && isItemOpen(c, parent))
  return r?.clickLinkEvent ? { readableId: r._id, point: r.clickLinkEvent.point } : null
}

/** 상위 캠페인 링크 (더 알아보기 등). 읽기형 아이템의 보상 링크면 +P 를 붙인다. */
function ParentLinks({ item }: { item: CampaignOneItem }) {
  if (item.links.length === 0) return null
  return <LinkButtons links={item.links} rewardOf={(link) => rewardFor(item, link)} />
}

/** 읽기형 아이템: 보기 보상 안내 + 그 아이템의 링크 */
function ReadableBlock({ parent, item }: { parent: CampaignOneItem; item: ReadableItem }) {
  const open = isItemOpen(item, parent)
  const event = item.clickLinkEvent
  // 보상도, 카드 이미지도, 링크도 없는 소개 아이템은 보여 줄 게 없다. (상위 본문이 소개를 맡는다)
  const hasCard = !!findAttachByFlag(item.attaches, CAMPAIGN_ITEM_CARD_FLAG)
  if (!event && !hasCard && item.links.length === 0) return null
  const rows: [string, ReactNode][] = []
  if (event) {
    rows.push(['보상', `${event.point.toLocaleString()}P`])
    if (event.maxes.length > 0) rows.push(['참여 간격', event.maxes.map(maxText).join(', ')])
    // 보상 링크가 상위 링크에 있으면 그쪽을 누르라고 알린다.
    const atParent = parent.links.find((l) => l.key === event.linkKey)
    if (atParent && !item.links.some((l) => l.key === event.linkKey)) {
      rows.push(['방법', `위의 '${atParent.label || atParent.key}' 를 누르면 받을 수 있어요.`])
    }
  }

  // 보상이 없는 소개 아이템이면 카드 이미지·링크만
  return (
    <ItemBlock parent={parent} item={item} open={open || !event}>
      <InfoRows rows={rows} />
      {item.links.length > 0 && (
        <LinkButtons links={item.links} rewardOf={(link) => rewardFor(parent, link, item)} />
      )}
    </ItemBlock>
  )
}

/**
 * 링크 버튼들. 보상 링크면 누를 때 클릭 보상을 보낸다.
 * 보상 응답은 기다리지 않고 바로 이동한다. 바깥 주소는 새 탭으로 열려 결과 안내가 이 화면에 남는다.
 */
export function LinkButtons({
  links,
  rewardOf,
}: {
  links: CampaignLink[]
  rewardOf?: (link: CampaignLink) => Reward | null
}) {
  const { user } = useAuth()
  const { click, notice } = useClickPoint()
  const rewards = links.map((l) => rewardOf?.(l) ?? null)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => {
          const reward = rewards[i]
          const onClick = () => {
            if (user && reward) click(reward.readableId, link.key, reward.point)
          }
          const className =
            'inline-flex items-center gap-2 rounded-md border border-brand-500 px-4 py-2 font-semibold text-brand-700 dark:text-indigo-300 no-underline transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10'
          const content = (
            <>
              {link.label || link.key}
              {reward && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  +{reward.point.toLocaleString()}P
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
      {!user && rewards.some(Boolean) && (
        <p className="text-xs text-neutral-500">로그인하고 누르면 포인트를 받을 수 있어요.</p>
      )}
      <ClickNoticeText notice={notice} />
    </div>
  )
}

function ClickNoticeText({ notice }: { notice: ClickNotice }) {
  if (!notice) return null
  return (
    <p
      role="status"
      className={`text-sm ${notice.ok ? 'text-green-700 dark:text-green-400' : 'text-neutral-500'}`}
    >
      {notice.message}
    </p>
  )
}
