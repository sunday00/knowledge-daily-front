import type { ReactNode } from 'react'
import { OpinionComposer } from '@/components/OpinionComposer.tsx'
import { ThreadItem } from '@/components/ThreadItem.tsx'
import { PendingThreadItem } from '@/components/PendingOpinion.tsx'
import { useThreadList } from '@/hooks/useThreadList.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import { scrollToOpinion } from '@/lib/scrollToOpinion.ts'
import { markOpinionAdded, useAddedOpinionIds } from '@/lib/addedOpinions.ts'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'

/**
 * 원글(상식, 문의/요청 글) 아래 대화록 목록 + 하단 고정 새 대화 입력창.
 * 하단 입력창에 가리지 않도록 쓰는 쪽에서 아래 여백(pb-32 정도)을 둔다.
 */
export function TargetThreads({
  target,
  backLink,
}: {
  target: OpinionTarget
  backLink?: ReactNode
}) {
  // 내가 새로 단 의견 (테두리로 살짝 강조). 새로고침 전까지 유지
  const addedIds = useAddedOpinionIds()
  const list = useThreadList(target.id)

  return (
    <>
      <ThreadSection target={target} list={list} addedIds={addedIds} backLink={backLink} />
      <OpinionComposer
        target={target}
        placeholder="새 대화를 시작해 보세요"
        // 보고 있던 목록 끝에 새 카드 → (남은 페이지가 있으면) 바로 다음 페이지를 잇고,
        // 그다음 새 카드를 화면 가운데로. 테두리 강조는 바로 표시
        onCreated={async (created) => {
          markOpinionAdded(created.opinion._id)
          await list.appendLocal(created)
          scrollToOpinion(created.opinion._id)
        }}
      />
    </>
  )
}

function ThreadSection({
  target,
  list,
  addedIds,
  backLink,
}: {
  target: OpinionTarget
  list: ReturnType<typeof useThreadList>
  addedIds: ReadonlySet<string>
  backLink?: ReactNode
}) {
  const { res, loading, loadingMore, error, loadMore } = list
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          대화록
          {res?.success ? (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              {res.total ?? res.items.length}
            </span>
          ) : null}
        </h3>
        {backLink}
      </div>

      {loading && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        list.rows.length === 0 ? (
          <p className="text-neutral-500">아직 대화가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {list.rows.map((row) =>
              row.kind === 'item' ? (
                <ThreadItem
                  key={row.item._id}
                  thread={row.item}
                  targetPath={target.path}
                  isNew={addedIds.has(row.item.opinion._id)}
                />
              ) : (
                // 화면에만 끼워 둔 새 대화. 그 대화가 실제 페이지로 오면 사라지고 제자리에 보인다
                <PendingThreadItem
                  key={`pending:${row.pending.key}`}
                  threadId={row.pending.threadId}
                  opinionId={row.pending.opinion._id}
                  targetPath={target.path}
                />
              ),
            )}
          </ul>
        )
      ) : null}

      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <p className="text-center text-sm text-neutral-500">불러오는 중...</p>}
    </section>
  )
}
