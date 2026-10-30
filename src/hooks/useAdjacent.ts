import { useQuery } from '@apollo/client'
import {
  ARTICLE_ADJACENT_QUERY,
  ASK_ADJACENT_QUERY,
  NOTICE_ADJACENT_QUERY,
} from '@/graphql/queries/adjacent.ts'
import { boardPath, type BoardConfig } from '@/lib/boards.ts'
import { isLive, useLiveWindowSearch } from '@/lib/liveWindow.ts'
import { noticeItemPath } from '@/lib/notice.ts'

/** 이전글/다음글 한쪽. 없으면 null */
export type AdjacentLink = { to: string; title: string } | null
export type Adjacent = { prev: AdjacentLink; next: AdjacentLink; loading: boolean }

/** 현재 글(id) 기준 앞뒤 한 건씩의 조회 조건. search 는 목록과 같은 조건(게시판 등). */
function adjacentVariables<S extends object>(id: string, search: S) {
  return {
    prev: { size: 1, page: 1, search: { ...search, _id: { lt: id } }, sort: { _id: -1 } },
    next: { size: 1, page: 1, search: { ...search, _id: { gt: id } }, sort: { _id: 1 } },
  }
}

// board 는 ObjectId 로 저장돼 있어 complex.id 로 변환해 검색해야 한다.
const boardSearch = (board: BoardConfig) => ({
  board: { eq: board._id },
  complex: { id: ['board'] },
})

export function useAdjacentAsk(board: BoardConfig, id: string): Adjacent {
  const { data, loading } = useQuery(ASK_ADJACENT_QUERY, {
    variables: adjacentVariables(id, boardSearch(board)),
    skip: !id,
  })
  const link = (r?: { success: number; items: { _id: string; quest: string }[] }) => {
    const it = r?.success ? r.items[0] : undefined
    return it ? { to: `${boardPath(board)}/${it._id}`, title: it.quest } : null
  }
  return {
    prev: link(data?.BoardQuery.prev),
    next: link(data?.BoardQuery.next),
    loading: loading && !data,
  }
}

export function useAdjacentArticle(board: BoardConfig, id: string): Adjacent {
  const { data, loading } = useQuery(ARTICLE_ADJACENT_QUERY, {
    variables: adjacentVariables(id, boardSearch(board)),
    skip: !id,
  })
  const link = (r?: { success: number; items: { _id: string; title: string }[] }) => {
    const it = r?.success ? r.items[0] : undefined
    return it ? { to: `${boardPath(board)}/${it._id}`, title: it.title } : null
  }
  return {
    prev: link(data?.BoardQuery.prev),
    next: link(data?.BoardQuery.next),
    loading: loading && !data,
  }
}

/** 공지는 게시 중(ACTIVE, 게시 기간 안)인 것끼리만 잇는다. 고정 여부와 상관없이 작성 순. */
export function useAdjacentNotice(id: string): Adjacent {
  const liveWindow = useLiveWindowSearch()
  const { data, loading } = useQuery(NOTICE_ADJACENT_QUERY, {
    variables: adjacentVariables(id, { status: { eq: 'ACTIVE' as const }, ...liveWindow }),
    skip: !id,
  })
  const link = (r?: {
    success: number
    items: { _id: string; title: string; startAt: unknown; endAt: unknown }[]
  }) => {
    const it = r?.success ? r.items[0] : undefined
    return it && isLive(it) ? { to: noticeItemPath(it._id), title: it.title } : null
  }
  return {
    prev: link(data?.NoticeQuery.prev),
    next: link(data?.NoticeQuery.next),
    loading: loading && !data,
  }
}
