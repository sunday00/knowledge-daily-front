import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { QUIZ_SENSE_PICK_LIST_QUERY } from '@/graphql/queries/quiz.ts'
import type { SenseSearchInput } from '@/graphql/__generated__/graphql.ts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { senseImagesOf, type QuizSenseCardData } from '@/lib/quiz.ts'
import { SearchInput } from '@/components/SearchInput.tsx'

const PAGE_SIZE = 20

/** 검색어가 있으면 제목 또는 설명에 포함된 항목. (useSenseMyList 와 같은 조건) */
const searchOf = (keyword: string): SenseSearchInput =>
  keyword
    ? {
        title: { contains: keyword },
        description: { contains: keyword },
        complex: { or: ['title', 'description'] },
      }
    : {}

/** 사진까지 받는 내 상식 목록. 커서로 더 보기 */
function useSensePickList(keyword: string) {
  const input = { size: PAGE_SIZE, search: searchOf(keyword) }
  const { data, previousData, loading, error, fetchMore, networkStatus } = useQuery(
    QUIZ_SENSE_PICK_LIST_QUERY,
    { variables: { input }, notifyOnNetworkStatusChange: true },
  )
  // 검색어가 바뀌어 새 결과를 받는 동안 이전 결과를 유지해 목록이 깜빡이지 않게 한다.
  const res = (data ?? previousData)?.SenseQuery.senseMyList
  const loadingMore = networkStatus === 3 // NetworkStatus.fetchMore

  const loadMore = () => {
    if (!res?.hasNext || !res.nextCursor || loadingMore) return
    void fetchMore({
      variables: { input: { ...input, after: res.nextCursor } },
      updateQuery: (prev, { fetchMoreResult }) => {
        const next = fetchMoreResult.SenseQuery.senseMyList
        return {
          ...prev,
          SenseQuery: {
            ...prev.SenseQuery,
            senseMyList: {
              ...next,
              items: [...prev.SenseQuery.senseMyList.items, ...next.items],
            },
          },
        }
      },
    })
  }

  return {
    res,
    loading: loading && !res,
    refreshing: loading && !!res && !loadingMore,
    loadingMore,
    error,
    loadMore,
  }
}

/** 내 상식 목록에서 문항에 쓸 상식을 고른다. 이미 고른 건 다시 못 고른다. */
export function MySensePicker({
  selectedIds,
  onPick,
  disabled,
}: {
  selectedIds: ReadonlySet<string>
  onPick: (sense: QuizSenseCardData) => void
  disabled?: boolean
}) {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const { res, loading, refreshing, loadingMore, error, loadMore } =
    useSensePickList(debouncedKeyword)

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
      <SearchInput
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="내 상식에서 제목 또는 설명으로 검색"
        aria-label="내 상식 검색"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 py-1.5 text-sm outline-none focus:border-brand-500"
      />

      {loading && <LoadingSpinner size="sm" />}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
      )}
      {res && !res.success && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        res.items.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {debouncedKeyword ? '검색 결과가 없습니다.' : '내 상식에 담긴 항목이 없습니다.'}
          </p>
        ) : (
          <ul
            className={`max-h-72 md:max-h-[60vh] divide-y divide-neutral-100 dark:divide-neutral-800 overflow-y-auto ${
              refreshing ? 'opacity-60' : ''
            }`}
          >
            {res.items.map((item) => {
              const picked = selectedIds.has(item._id)
              const images = senseImagesOf(item.attaches)
              return (
                <li key={item._id} className="flex items-center gap-3 py-2">
                  {images[0] ? (
                    <SafeImage
                      src={images[0].thumb}
                      alt={images[0].alt}
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded object-cover bg-neutral-100 dark:bg-neutral-800"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded bg-neutral-100 dark:bg-neutral-800"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.title}
                      {item.nativeLang && (
                        <span className="ml-2 font-normal text-neutral-500">{item.nativeLang}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-neutral-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    className="btn shrink-0 text-xs px-2 py-1"
                    disabled={disabled || picked}
                    onClick={() =>
                      onPick({
                        _id: item._id,
                        title: item.title,
                        nativeLang: item.nativeLang,
                        description: item.description,
                        lv: item.lv,
                        tags: item.tags.map((t) => ({ _id: t._id, name: t.name })),
                        images,
                      })
                    }
                  >
                    {picked ? '추가됨' : '추가'}
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : null}

      {res?.success && res.hasNext ? (
        <div className="flex justify-center">
          <button type="button" className="btn text-sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
