import { useQuery } from '@apollo/client'
import {
  ASK_BOARD_LIST_QUERY,
  ISOLATED_PAGE_SLUG_LIST_QUERY,
  MY_ARTICLE_LIST_QUERY,
} from '@/graphql/queries/my.ts'
import { opinionThreadPathOf, targetPathOf } from '@/lib/myRecord.ts'

/** 원글 (종류 + id) */
type Target = { targetEntity: string; targetId: string }

const byIds = (ids: string[]) => ({
  variables: { input: { size: ids.length, search: { _id: { mul: ids } } } },
  skip: ids.length === 0,
})

const uniq = (list: string[]) => [...new Set(list)]

/**
 * 원글 주소. 상식 / 퀴즈 / 이벤트 / 공지는 id 로 바로 만들고,
 * 게시글 / 문의는 게시판, 독립 페이지는 slug 가 필요해 그 종류가 있을 때만 한 번씩 더 찾는다.
 * pathOf 는 모르면 null. loading = 아직 찾는 중
 */
export function useTargetPaths(targets: readonly Target[]) {
  const idsOf = (entity: string) =>
    uniq(targets.filter((t) => t.targetEntity === entity).map((t) => t.targetId))

  const articles = useQuery(MY_ARTICLE_LIST_QUERY, byIds(idsOf('Article')))
  const asks = useQuery(ASK_BOARD_LIST_QUERY, byIds(idsOf('Ask')))
  const pages = useQuery(ISOLATED_PAGE_SLUG_LIST_QUERY, byIds(idsOf('IsolatedPage')))

  const boardOf = new Map<string, string>([
    ...(articles.data?.BoardQuery.articleList.items ?? []).map((a) => [a._id, a.board] as const),
    ...(asks.data?.BoardQuery.askList.items ?? []).map((a) => [a._id, a.board] as const),
  ])
  const slugOf = new Map(
    (pages.data?.IsolatedPageQuery.isolatedPageStandardList.items ?? []).map((p) => [
      p._id,
      p.slug,
    ]),
  )

  const pathOf = (t: Target) =>
    targetPathOf(t.targetEntity, t.targetId, {
      board: boardOf.get(t.targetId),
      slug: slugOf.get(t.targetId),
    })
  const loading = articles.loading || asks.loading || pages.loading
  return { pathOf, loading }
}

type PathOpinion = {
  _id: string
  parentInfo?: { targetEntity: string; targetId: string; threadId: string } | null
}

/** 의견마다 그 의견이 있는 대화 주소 (opinion.parentInfo 로 만든다). 모르면 null */
export function useOpinionPaths(opinions: readonly PathOpinion[]): Map<string, string | null> {
  const { pathOf } = useTargetPaths(opinions.flatMap((o) => (o.parentInfo ? [o.parentInfo] : [])))
  return new Map(
    opinions.map((o) => [
      o._id,
      o.parentInfo ? opinionThreadPathOf(pathOf(o.parentInfo), o.parentInfo.threadId) : null,
    ]),
  )
}
