import { useEffect, useRef, useState } from 'react'
import { useApolloClient } from '@apollo/client'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OPINION_BY_SID_QUERY, OPINION_ITEM_FRAGMENT } from '@/graphql/queries/opinion.ts'
import { OpinionItem } from '@/components/OpinionItem.tsx'
import { PendingOpinionItem } from '@/components/PendingOpinion.tsx'
import { OpinionComposer } from '@/components/OpinionComposer.tsx'
import { ThreadReactionBar } from '@/components/ThreadReactionBar.tsx'
import { useOpinionList } from '@/hooks/useOpinionList.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import { MentionProvider } from '@/components/MentionContext.tsx'
import { opinionDomId, scrollToOpinion } from '@/lib/scrollToOpinion.ts'
import { isMissingSid, markMissingSid } from '@/lib/missingOpinions.ts'
import { threadPath, type OpinionTarget } from '@/lib/opinionTarget.ts'
import { THREAD_MAX_OPINIONS } from '@/lib/opinionLimits.ts'
import { markOpinionAdded, useAddedOpinionIds } from '@/lib/addedOpinions.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

/**
 * 원글의 대화(thread) 한 건: 의견 목록 + 하단 고정 입력창(대화록 리액션 포함).
 * 하단 입력창에 가리지 않도록 쓰는 쪽에서 아래 여백(pb-32 정도)을 둔다.
 */
export function ThreadConversation({
  target: current,
  threadId,
}: {
  target: OpinionTarget
  threadId: string
}) {
  // 내가 새로 단 의견 (테두리로 살짝 강조). 새로고침 전까지 유지
  const addedIds = useAddedOpinionIds()
  const list = useOpinionList(threadId)
  const client = useApolloClient()

  // 입력창의 @sid 미리보기: 화면에 이미 있는 의견에서 먼저 찾는다 (임시 카드는 캐시의 최신 내용)
  const findBySid = (sid: number) => {
    for (const row of list.rows) {
      if (row.kind === 'item') {
        if (row.item.sid === sid) return row.item
      } else if (row.pending.opinion.sid === sid) {
        return (
          client.cache.readFragment({
            fragment: OPINION_ITEM_FRAGMENT,
            id: client.cache.identify({ __typename: 'Opinion', _id: row.pending.opinion._id }),
          }) ?? row.pending.opinion
        )
      }
    }
    return undefined
  }

  // 한 대화의 의견 수 한도. 넘으면 입력창 대신 새 대화를 열라고 안내
  const threadFull = (list.res?.total ?? 0) >= THREAD_MAX_OPINIONS

  // @sid 링크 이동 중/실패 안내
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const notFound = (sid: number) => {
    markMissingSid(sid)
    setNotice({ text: `@${sid} 의견은 삭제되었거나 없는 의견입니다.`, error: true })
  }

  /**
   * 이 대화의 의견으로 이동. 화면에 있으면 바로 스크롤,
   * 없으면 목록을 비우고 첫 페이지부터 그 의견이 나올 때까지 받은 뒤 이동한다.
   */
  const jumpToOpinion = async (opinionId: string, sid?: number) => {
    const shown = list.rows.some((r) =>
      r.kind === 'item' ? r.item._id === opinionId : r.pending.opinion._id === opinionId,
    )
    if (shown) {
      setNotice(null)
      scrollToOpinion(opinionId)
      return
    }
    setNotice({ text: `${sid ? `@${sid} ` : ''}의견을 찾는 중...` })
    if (await list.loadUntil(opinionId)) {
      setNotice(null)
      scrollToOpinion(opinionId)
    } else if (sid) {
      notFound(sid)
    } else {
      setNotice({ text: '의견을 찾을 수 없습니다.', error: true })
    }
  }

  const jumpToSid = async (sid: number) => {
    // 이미 없다고 확인한 의견이면 다시 찾지 않고 같은 안내만
    if (isMissingSid(sid)) return notFound(sid)

    const local = findBySid(sid)
    if (local) return jumpToOpinion(local._id, sid)

    setNotice({ text: `@${sid} 의견을 찾는 중...` })
    try {
      const { data } = await client.query({
        query: OPINION_BY_SID_QUERY,
        variables: { input: { size: 1, search: { sid: { eq: sid } } } },
      })
      const target = data.OpinionQuery.opinionStandardList.items[0]
      if (!target) return notFound(sid)
      if (target.parent !== threadId) {
        // 다른 대화의 의견이면 그 대화 페이지로 가서 이동 (#opinion-<_id>)
        setNotice(null)
        // 같은 원글이면 지금 원글 주소 아래로, 아니면 상식 대화로 (다른 원글 주소는 알 수 없음)
        const path = target.targetId === current.id ? current.path : `/sense/${target.targetId}`
        navigate(`${threadPath(path, target.parent)}#${opinionDomId(target._id)}`)
        return
      }
      await jumpToOpinion(target._id, sid)
    } catch (e: unknown) {
      setNotice({ text: `@${sid} 의견을 불러오지 못했습니다.`, error: true })
      console.error(e)
    }
  }

  // 다른 대화에서 링크로 넘어온 경우 (#opinion-<_id>): 목록을 받은 뒤 한 번 이동
  const hashId = location.hash.startsWith('#opinion-')
    ? location.hash.slice('#opinion-'.length)
    : null
  const jumpedHash = useRef<string | null>(null)
  const listReady = !!list.res
  useEffect(() => {
    if (!hashId || !listReady || jumpedHash.current === hashId) return
    jumpedHash.current = hashId
    void jumpToOpinion(hashId)
    // jumpToOpinion 은 렌더마다 새로 만들어지지만 hash 당 한 번만 실행하면 된다
  }, [hashId, listReady])

  return (
    <MentionProvider findBySid={findBySid} jumpToSid={(sid) => void jumpToSid(sid)}>
      <OpinionSection targetPath={current.path} list={list} addedIds={addedIds} notice={notice} />
      {/* 하단 고정 영역에 대화록 리액션 줄이 더해진 만큼 여백 */}
      <div aria-hidden className="h-12" />
      <OpinionComposer
        target={current}
        parent={threadId}
        header={<ThreadReactionBar threadId={threadId} />}
        blocked={
          threadFull && (
            <>
              이 대화는 의견이 {THREAD_MAX_OPINIONS.toLocaleString()}개에 이르러 더 이상 의견을 달
              수 없습니다.{' '}
              <Link to={current.path} className="text-brand-600">
                대화록
              </Link>
              에서 새 대화를 시작해 주세요.
            </>
          )
        }
        placeholder="이 대화에 의견을 남겨 보세요"
        // 보고 있던 목록 끝에 새 카드 → (남은 페이지가 있으면) 바로 다음 페이지를 잇고,
        // 그다음 새 카드를 화면 가운데로. 테두리 강조는 바로 표시
        onCreated={async (created) => {
          markOpinionAdded(created.opinion._id)
          await list.appendLocal(created)
          scrollToOpinion(created.opinion._id)
        }}
      />
    </MentionProvider>
  )
}

function OpinionSection({
  targetPath,
  list,
  addedIds,
  notice,
}: {
  targetPath: string
  list: ReturnType<typeof useOpinionList>
  addedIds: ReadonlySet<string>
  notice: { text: string; error?: boolean } | null
}) {
  const { res, loading, loadingMore, error, loadMore } = list
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          대화
          {res?.success ? (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              의견 {res.total ?? res.items.length}
            </span>
          ) : null}
        </h3>
        <Link
          to={targetPath}
          className="text-sm text-neutral-500 hover:text-brand-600 no-underline"
        >
          ← 대화록 전체 보기
        </Link>
      </div>

      {notice && (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${
            notice.error
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          {notice.text}
        </p>
      )}
      {loading && <LoadingSpinner />}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        list.rows.length === 0 ? (
          <p className="text-neutral-500">아직 의견이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {list.rows.map((row) =>
              row.kind === 'item' ? (
                <OpinionItem
                  key={row.item._id}
                  opinion={row.item}
                  isNew={addedIds.has(row.item._id)}
                />
              ) : (
                // 화면에만 끼워 둔 새 의견. 그 의견이 실제 페이지로 오면 사라지고 제자리에 보인다
                <PendingOpinionItem
                  key={`pending:${row.pending.key}`}
                  opinionId={row.pending.opinion._id}
                />
              ),
            )}
          </ul>
        )
      ) : null}

      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <LoadingSpinner size="sm" />}
    </section>
  )
}
