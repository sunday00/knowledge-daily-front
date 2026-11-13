import type { ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import {
  MY_ARTICLE_LIST_QUERY,
  MY_ASK_LIST_QUERY,
  MY_OPINION_LIST_QUERY,
  MY_QUIZ_ANSWER_LIST_QUERY,
  MY_QUIZ_LIST_QUERY,
  MY_REACTION_LIST_QUERY,
  MY_THREAD_LIST_QUERY,
} from '@/graphql/queries/my.ts'
import { SENSE_STANDARD_LIST_QUERY } from '@/graphql/queries/sense.ts'
import { ThreadItem } from '@/components/ThreadItem.tsx'
import { useCursorList } from '@/hooks/useCursorList.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import { useOpinionPaths, useTargetPaths } from '@/hooks/useOpinionPaths.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { SenseItem } from '@/components/SenseItem.tsx'
import { QuizCard } from '@/components/quiz/QuizCard.tsx'
import {
  RecordArticleCard,
  RecordAskCard,
  RecordMissingCard,
  RecordOpinionCard,
  type RecordOpinion,
} from '@/components/record/RecordCards.tsx'
import { reactionOf } from '@/lib/reactions.ts'
import {
  OPINION_TAB_ENTITIES,
  REACTION_ENTITY,
  RECORD_PAGE_SIZE,
  rangeOf,
  type RecordType,
} from '@/lib/myRecord.ts'
import { formatDateTime } from '@/lib/formatDate.ts'

// 최신순. _id 는 만든 순서라 커서로 이어 받기에 맞다.
const page = (search: object, after?: string) => ({
  input: { size: RECORD_PAGE_SIZE, sort: { _id: -1 }, search, ...(after && { after }) },
})
const mine = (userId: string) => ({ user: { _id: { eq: userId } } })
const byIds = (ids: string[]) => ({
  variables: { input: { size: ids.length, search: { _id: { mul: ids } } } },
  skip: ids.length === 0,
})

/** 받은 순서대로 한 쪽(RECORD_PAGE_SIZE)씩 나눈다. 앞쪽 묶음은 다음 쪽을 받아도 그대로라, 쪽마다 붙는 조회가 다시 나가지 않는다 */
const byPage = <T,>(list: readonly T[]): T[][] => {
  const pages: T[][] = []
  for (let i = 0; i < list.length; i += RECORD_PAGE_SIZE) {
    pages.push(list.slice(i, i + RECORD_PAGE_SIZE))
  }
  return pages
}

/** 목록 공통 틀: 불러오는 중 / 실패 / 비어 있음 / 끝까지 내리면 다음 쪽 */
function ListFrame({
  loading,
  error,
  empty,
  emptyText,
  hasNext,
  loadingMore,
  loadMore,
  children,
}: {
  loading: boolean
  error?: { message: string }
  empty: boolean
  emptyText: string
  hasNext: boolean
  loadingMore: boolean
  loadMore: () => void
  children: ReactNode
}) {
  const sentinel = useInfiniteScroll<HTMLDivElement>(loadMore, hasNext && !loadingMore)
  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (empty) return <p className="text-neutral-500">{emptyText}</p>
  return (
    <div className="space-y-3">
      <ul className="space-y-3">{children}</ul>
      {loadingMore && <LoadingSpinner size="sm" />}
      <div ref={sentinel} aria-hidden />
    </div>
  )
}

/** 내 게시글 > 게시글 */
export function MyArticleList() {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_ARTICLE_LIST_QUERY,
    variables: (after) => page(mine(user?.userId ?? ''), after),
    pick: (d) => d.BoardQuery.articleList,
    put: (d, list) => ({ ...d, BoardQuery: { ...d.BoardQuery, articleList: list } }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="아직 쓴 게시글이 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {items.map((a) => (
        <RecordArticleCard key={a._id} article={a} />
      ))}
    </ListFrame>
  )
}

/** 내 게시글 > 문의 */
export function MyAskList() {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_ASK_LIST_QUERY,
    variables: (after) => page(mine(user?.userId ?? ''), after),
    pick: (d) => d.BoardQuery.askList,
    put: (d, list) => ({ ...d, BoardQuery: { ...d.BoardQuery, askList: list } }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="아직 남긴 문의가 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {items.map((a) => (
        <RecordAskCard key={a._id} ask={a} />
      ))}
    </ListFrame>
  )
}

/** 내 퀴즈 > 내가 만든 퀴즈 (만드는 중인 것 포함) */
export function MyQuizList() {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_QUIZ_LIST_QUERY,
    variables: (after) => page(mine(user?.userId ?? ''), after),
    pick: (d) => d.QuizQuery.quizList,
    put: (d, list) => ({ ...d, QuizQuery: { ...d.QuizQuery, quizList: list } }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="아직 만든 퀴즈가 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {items.map((q) => (
        <QuizCard key={q._id} item={q} mine />
      ))}
    </ListFrame>
  )
}

/** 내 퀴즈 > 내가 시도한 퀴즈 (마지막 시도 순). 퀴즈 카드 위에 내 기록 */
export function MyTriedQuizList() {
  const { user } = useAuth()
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_QUIZ_ANSWER_LIST_QUERY,
    // 서버 기본 정렬(마지막 시도 순)을 쓴다
    variables: (after) => ({ input: { size: RECORD_PAGE_SIZE, ...(after && { after }) } }),
    pick: (d) => d.QuizQuery.quizAnswerMyList,
    put: (d, list) => ({ ...d, QuizQuery: { ...d.QuizQuery, quizAnswerMyList: list } }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="아직 풀어 본 퀴즈가 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {items.map((a) => (
        <li key={a._id} className="space-y-1">
          <p className="text-xs text-neutral-500">
            최고 {a.correctCnt.toLocaleString()}/{a.quiz.quizItemsCnt.toLocaleString()} · 시도{' '}
            {a.tryCnt.toLocaleString()}회 · 마지막{' '}
            <time dateTime={String(a.updatedAt)}>{formatDateTime(a.updatedAt)}</time>
          </p>
          <ul>
            <QuizCard item={a.quiz} mine={a.quiz.user?._id === user?.userId} />
          </ul>
        </li>
      ))}
    </ListFrame>
  )
}

/** 의견 카드들 (대화 주소를 한꺼번에 찾는다) */
function OpinionCards({ opinions }: { opinions: readonly RecordOpinion[] }) {
  const paths = useOpinionPaths(opinions)
  return (
    <>
      {opinions.map((o) => (
        <RecordOpinionCard key={o._id} opinion={o} path={paths.get(o._id)} />
      ))}
    </>
  )
}

/** 내 의견 > 전체 / 상식 / 게시판 / 퀴즈 (tab 의 원글 종류로 거른다) */
export function MyOpinionList({ tab }: { tab: string }) {
  const { user } = useAuth()
  const entities = OPINION_TAB_ENTITIES[tab]
  const search = {
    ...mine(user?.userId ?? ''),
    ...(entities && { targetEntity: rangeOf(entities) }),
  }
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_OPINION_LIST_QUERY,
    variables: (after) => page(search, after),
    pick: (d) => d.OpinionQuery.opinionStandardList,
    put: (d, list) => ({ ...d, OpinionQuery: { ...d.OpinionQuery, opinionStandardList: list } }),
    skip: !user,
  })
  const items = res?.items ?? []
  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyText="아직 남긴 의견이 없어요."
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {/* 쪽마다 원글 주소를 따로 찾아, 다음 쪽을 받으면 새 쪽의 원글만 조회한다 */}
      {byPage(items).map((chunk, i) => (
        <OpinionCards key={i} opinions={chunk} />
      ))}
    </ListFrame>
  )
}

/**
 * 내 반응 > 상식 / 게시글 / 의견 / 대화록. names 가 있으면 그 반응들 중 하나라도 남긴 것만 (or).
 * 반응 목록엔 대상 id 만 있어서, 반응 목록의 쪽마다 그 쪽에서 새로 나온 대상만 id 로 조회해 반응 순서대로 그린다.
 * (다음 쪽을 받아도 앞쪽 조회는 다시 나가지 않는다)
 */
export function MyReactedList({ type, names }: { type: RecordType; names: string[] }) {
  const { user } = useAuth()
  const search = {
    ...mine(user?.userId ?? ''),
    // enum 검색은 Range 형식 ({ eq } / { mul })
    targetEntity: { eq: REACTION_ENTITY[type] },
    ...(names.length > 0 && { name: { mul: names } }),
  }
  const { res, loading, loadingMore, error, loadMore } = useCursorList({
    query: MY_REACTION_LIST_QUERY,
    variables: (after) => page(search, after),
    pick: (d) => d.ReactionQuery.reactionStandardList,
    put: (d, list) => ({
      ...d,
      ReactionQuery: { ...d.ReactionQuery, reactionStandardList: list },
    }),
    skip: !user,
  })

  // 같은 대상에 여러 반응을 했으면 한 장으로 모으고, 처음 나온 순서(최신)를 따른다.
  // 대상은 처음 나온 반응의 쪽에 속한다 → 쪽별 대상 id 묶음
  const groups = new Map<string, string[]>()
  const pages: string[][] = []
  byPage(res?.items ?? []).forEach((chunk, p) => {
    for (const r of chunk) {
      const prev = groups.get(r.targetId)
      if (!prev) (pages[p] ??= []).push(r.targetId)
      groups.set(r.targetId, [...(prev ?? []), r.name])
    }
  })
  const ids = [...groups.keys()]

  return (
    <ListFrame
      loading={loading}
      error={error}
      empty={ids.length === 0}
      emptyText={
        names.length > 0
          ? `${names.map((n) => reactionOf(n).emoji).join(' ')} 반응을 남긴 콘텐츠가 없어요.`
          : '아직 반응을 남긴 콘텐츠가 없어요.'
      }
      hasNext={!!res?.hasNext}
      loadingMore={loadingMore}
      loadMore={loadMore}
    >
      {pages.map((pageIds, i) => (
        <ReactedPage key={i} type={type} ids={pageIds} groups={groups} />
      ))}
    </ListFrame>
  )
}

/** 카드 위에 붙는 '내가 남긴 반응' 줄 */
function MyMarks({ names }: { names: string[] | undefined }) {
  if (!names?.length) return null
  return (
    <p className="text-xs text-neutral-500">
      내 반응{' '}
      {names.map((n) => (
        <span key={n} title={reactionOf(n).label}>
          {reactionOf(n).emoji}
        </span>
      ))}
    </p>
  )
}

type ReactedProps = { ids: string[]; groups: Map<string, string[]> }

/** 반응 목록 한 쪽에서 새로 나온 대상들 */
function ReactedPage({ type, ...props }: ReactedProps & { type: RecordType }) {
  if (type === 'sense') return <ReactedSenses {...props} />
  if (type === 'article') return <ReactedArticles {...props} />
  if (type === 'thread') return <ReactedThreads {...props} />
  return <ReactedOpinions {...props} />
}

function ReactedSenses({ ids, groups }: ReactedProps) {
  const { data, loading } = useQuery(SENSE_STANDARD_LIST_QUERY, byIds(ids))
  const byId = new Map((data?.SenseQuery.senseStandardList.items ?? []).map((s) => [s._id, s]))
  if (loading && !data) return <LoadingSpinner />
  return (
    <>
      {ids.map((id) => {
        const sense = byId.get(id)
        if (!sense) return <RecordMissingCard key={id} />
        return (
          <li key={id} className="space-y-1">
            <MyMarks names={groups.get(id)} />
            <ul>
              <SenseItem item={sense} />
            </ul>
          </li>
        )
      })}
    </>
  )
}

function ReactedArticles({ ids, groups }: ReactedProps) {
  const { data, loading } = useQuery(MY_ARTICLE_LIST_QUERY, byIds(ids))
  const byId = new Map((data?.BoardQuery.articleList.items ?? []).map((a) => [a._id, a]))
  if (loading && !data) return <LoadingSpinner />
  return (
    <>
      {ids.map((id) => {
        const article = byId.get(id)
        if (!article) return <RecordMissingCard key={id} />
        return (
          <li key={id} className="space-y-1">
            <MyMarks names={groups.get(id)} />
            <ul>
              <RecordArticleCard article={article} />
            </ul>
          </li>
        )
      })}
    </>
  )
}

function ReactedOpinions({ ids, groups }: ReactedProps) {
  const { data, loading } = useQuery(MY_OPINION_LIST_QUERY, byIds(ids))
  const opinions = data?.OpinionQuery.opinionStandardList.items ?? []
  const byId = new Map(opinions.map((o) => [o._id, o]))
  const paths = useOpinionPaths(opinions)
  if (loading && !data) return <LoadingSpinner />
  return (
    <>
      {ids.map((id) => {
        const opinion = byId.get(id)
        if (!opinion) return <RecordMissingCard key={id} />
        return (
          <li key={id} className="space-y-1">
            <MyMarks names={groups.get(id)} />
            <ul>
              <RecordOpinionCard opinion={opinion} path={paths.get(id)} />
            </ul>
          </li>
        )
      })}
    </>
  )
}

/** 대화록 자체에 남긴 반응. 대화록 카드(ThreadItem)는 원글 주소가 있어야 대화로 이동한다 */
function ReactedThreads({ ids, groups }: ReactedProps) {
  const { data, loading } = useQuery(MY_THREAD_LIST_QUERY, byIds(ids))
  const threads = data?.OpinionQuery.threadStandardList.items ?? []
  const byId = new Map(threads.map((t) => [t._id, t]))
  // 대화에 원글 종류 / id 가 같이 와서, 게시판 / slug 가 필요한 원글만 더 찾는다
  const targets = useTargetPaths(threads)
  if ((loading && !data) || targets.loading) return <LoadingSpinner />
  return (
    <>
      {ids.map((id) => {
        const thread = byId.get(id)
        const targetPath = thread ? targets.pathOf(thread) : null
        if (!thread) return <RecordMissingCard key={id} />
        return (
          <li key={id} className="space-y-1">
            <MyMarks names={groups.get(id)} />
            <ul>
              {targetPath ? (
                <ThreadItem thread={thread} targetPath={targetPath} />
              ) : (
                // 원글이 지워졌거나 찾을 수 없음
                <RecordMissingCard />
              )}
            </ul>
          </li>
        )
      })}
    </>
  )
}
