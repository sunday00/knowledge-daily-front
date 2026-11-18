import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { MY_BLOCK_LIST_QUERY, MY_SUSPECT_LIST_QUERY } from '@/graphql/queries/villain.ts'
import type { MyBlockListQuery, MySuspectListQuery } from '@/graphql/__generated__/graphql.ts'
import { useCursorList } from '@/hooks/useCursorList.ts'
import { useToggleBlock } from '@/actions/villain.ts'
import { ListFrame, byPage } from '@/components/record/RecordLists.tsx'
import { ReportStatus } from '@/components/ReportStatus.tsx'
import { TargetLabel, useBlockTargets } from '@/components/villain/VillainTargets.tsx'
import { formatDateTime } from '@/lib/formatDate.ts'
import { parseReportQuest } from '@/lib/reportReasons.ts'
import { TARGET_LABEL, VILLAIN_PAGE_SIZE, type BlockEntity } from '@/lib/villainManage.ts'

type BlockItem = MyBlockListQuery['VillainQuery']['villainStandardBlockList']['items'][number]
type SuspectItem = MySuspectListQuery['VillainQuery']['villainStandardSuspectList']['items'][number]

// 최신순. _id 는 만든 순서라 커서로 이어 받기에 맞다.
const page = (search: object, after?: string) => ({
  input: { size: VILLAIN_PAGE_SIZE, sort: { _id: -1 }, search, ...(after && { after }) },
})

const row = 'flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3'

/** 차단 > 유저 / 게시글 / 의견 / 퀴즈 */
export function MyBlockList({ entity }: { entity: BlockEntity }) {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_BLOCK_LIST_QUERY,
    variables: (after) => page({ targetEntity: { eq: entity } }, after),
    pick: (d) => d.VillainQuery.villainStandardBlockList,
    put: (d, list) => ({
      ...d,
      VillainQuery: { ...d.VillainQuery, villainStandardBlockList: list },
    }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText={`차단한 ${TARGET_LABEL[entity]}가 없어요.`}
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {/* 쪽마다 대상을 한 번에 찾아, 다음 쪽을 받으면 새 쪽의 대상만 조회한다 */}
      {byPage(items).map((chunk, i) => (
        <BlockPage key={i} items={chunk} />
      ))}
    </ListFrame>
  )
}

function BlockPage({ items }: { items: BlockItem[] }) {
  const { views, loading } = useBlockTargets(items)
  return (
    <>
      {items.map((b) => (
        <BlockRow key={b._id} block={b} views={views} loading={loading} />
      ))}
    </>
  )
}

/** 차단 한 줄. 해제하면 '다시 차단' 으로 바뀌어 되돌릴 수 있다 */
function BlockRow({
  block,
  views,
  loading,
}: {
  block: BlockItem
  views: ReturnType<typeof useBlockTargets>['views']
  loading: boolean
}) {
  const { toggle } = useToggleBlock()
  const [blocked, setBlocked] = useState(true)
  return (
    <li className={`${row} rounded-lg border border-neutral-200 dark:border-neutral-800`}>
      <div className={`min-w-0 flex-1 space-y-1 ${blocked ? '' : 'opacity-50'}`}>
        <TargetLabel target={block} views={views} loading={loading} />
        <p className="text-xs text-neutral-500">
          <time dateTime={String(block.createdAt)}>{formatDateTime(block.createdAt)}</time> 차단
        </p>
      </div>
      <button
        type="button"
        className="btn shrink-0 px-2 py-1 text-xs"
        onClick={() => {
          toggle({ entity: block.targetEntity, id: block.targetId }, !blocked)
          setBlocked(!blocked)
        }}
      >
        {blocked ? '차단 해제' : '다시 차단'}
      </button>
    </li>
  )
}

/** 신고 > 전체 / 접수됨 / 진행 중 / 처리됨 (status 가 null 이면 전체) */
export function MySuspectList({ status }: { status: string | null }) {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_SUSPECT_LIST_QUERY,
    variables: (after) => page(status ? { status: { eq: status } } : {}, after),
    pick: (d) => d.VillainQuery.villainStandardSuspectList,
    put: (d, list) => ({
      ...d,
      VillainQuery: { ...d.VillainQuery, villainStandardSuspectList: list },
    }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="신고한 내역이 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {byPage(items).map((chunk, i) => (
        <SuspectPage key={i} items={chunk} />
      ))}
    </ListFrame>
  )
}

function SuspectPage({ items }: { items: SuspectItem[] }) {
  const { views, loading } = useBlockTargets(items)
  return (
    <>
      {items.map((s) => {
        const { label, detail } = parseReportQuest(s.quest)
        return (
          <li
            key={s._id}
            className="space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <TargetLabel target={s} views={views} loading={loading} />
            <p className="text-sm">
              <span className="font-medium">{label}</span>
              {detail && (
                <span className="text-neutral-600 dark:text-neutral-400"> · {detail}</span>
              )}
            </p>
            <p className="text-xs text-neutral-500">
              <time dateTime={String(s.createdAt)}>{formatDateTime(s.createdAt)}</time> 신고
              {s.handledAt ? <> · {formatDateTime(s.handledAt)} 처리</> : null}
            </p>
            <div className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
              <ReportStatus
                target={TARGET_LABEL[s.targetEntity as BlockEntity] ?? s.targetEntity}
                villainStatus={s}
              />
              {s.answer && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium">관리자 답변</span> · {s.answer}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </>
  )
}
