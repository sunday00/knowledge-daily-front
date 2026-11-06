import { useQuery } from '@apollo/client'
import { ATTACH_MY_LIST_QUERY } from '@/graphql/queries/attach.ts'
import type { AttachListMyQry, AttachMyListQuery } from '@/graphql/__generated__/graphql.ts'
import { useOncePerCursor } from '@/hooks/usePendingCards.ts'

export const MY_ATTACH_PAGE_SIZE = 24

export type MyAttach = AttachMyListQuery['AttachQuery']['attachMyList']['items'][number]

type AttachLike = { src?: unknown; elements?: readonly { name: string; size: number[] }[] }

/**
 * 저장된 주소들 ({ [크기 이름]: url }).
 * 서버 src 는 { 이름: url } 이거나, 업로드 확정 때 그대로 저장된 elements 순서의 url 배열일 수 있어 둘 다 맞춘다.
 */
export const attachSrcOf = (a: AttachLike): Record<string, string> => {
  const src = a.src ?? {}
  if (Array.isArray(src)) {
    return Object.fromEntries(
      (a.elements ?? []).flatMap((el, i) =>
        typeof src[i] === 'string' ? [[el.name, src[i]]] : [],
      ),
    )
  }
  return src as Record<string, string>
}

/** 목록에 쓸 작은 이미지 주소. 크기 정보가 있으면 가로가 가장 작은 것, 없으면 thumbnail */
export const attachThumbOf = (a: AttachLike) => {
  const src = attachSrcOf(a)
  const smallest = [...(a.elements ?? [])]
    .filter((el) => src[el.name] && el.size[0])
    .sort((x, z) => x.size[0] - z.size[0])[0]
  return (
    (smallest && src[smallest.name]) ?? src.thumbnail ?? src.full ?? Object.values(src)[0] ?? ''
  )
}

// 서버가 남기는 기록용 flag (예: 원래 업로더). 별칭으로 보이지 않게 뺀다
const SYSTEM_FLAG = /^original_uploader_/
export const aliasesOf = (flags: readonly string[]) => flags.filter((f) => !SYSTEM_FLAG.test(f))
export const systemFlagsOf = (flags: readonly string[]) => flags.filter((f) => SYSTEM_FLAG.test(f))

const inputOf = (keyword: string, after?: string): AttachListMyQry => ({
  size: MY_ATTACH_PAGE_SIZE,
  // 최신순. _id 는 만든 순서라 커서로 이어 받기에 맞다.
  sort: { _id: -1 },
  // 서버가 별칭 / 파일 이름에서 부분일치로 찾는다. (특수문자도 글자 그대로)
  ...(keyword && { search: { keyword: { contains: keyword } } }),
  ...(after && { after }),
})

/** 내 이미지 목록. 검색어로 거르고, 커서로 이어 받는다. */
export function useMyAttaches(keyword: string, { skip = false } = {}) {
  const { data, loading, error, fetchMore, networkStatus, refetch } = useQuery(
    ATTACH_MY_LIST_QUERY,
    {
      variables: { input: inputOf(keyword) },
      // 방금 올린 사진도 보이도록 들어올 때마다 새로 받는다
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      skip,
    },
  )
  const res = data?.AttachQuery.attachMyList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const fetchPage = useOncePerCursor((after: string) =>
    fetchMore({
      variables: { input: inputOf(keyword, after) },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.AttachQuery.attachMyList
        return {
          ...prev,
          AttachQuery: {
            ...prev.AttachQuery,
            attachMyList: {
              ...next,
              items: [...prev.AttachQuery.attachMyList.items, ...next.items],
            },
          },
        }
      },
    }),
  )

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchPage(res.nextCursor)
  }

  return { res, loading: loading && !res, loadingMore, error, loadMore, refetch }
}
