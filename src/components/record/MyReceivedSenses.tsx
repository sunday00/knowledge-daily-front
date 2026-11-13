import { useState } from 'react'
import { SenseItem } from '@/components/SenseItem.tsx'
import { MyTagFilter } from '@/components/MyTagFilter.tsx'
import { TagSenseList } from '@/components/TagSenseList.tsx'
import { MySenseButton } from '@/components/MySenseButton.tsx'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { useSenseMyList } from '@/hooks/useSenseMyList.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { SearchInput } from '@/components/SearchInput.tsx'

/**
 * 내 상식 > 내가 받은 상식 (예전 /sense/my-sense). 위에 내 관심 태그 줄, 태그를 고르면 그 태그의 내 상식만.
 * tagPath(이름 없음) = 전체
 */
export function MyReceivedSenses({
  tag,
  tagPath,
}: {
  tag?: string
  tagPath: (name?: string) => string
}) {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const { res, loading, refreshing, loadingMore, error, loadMore } =
    useSenseMyList(debouncedKeyword)

  return (
    <div className="space-y-4">
      <MyTagFilter active={tag} pathOf={tagPath} />

      {tag ? (
        <TagSenseList tag={tag} filter="my" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="min-w-0 flex-1">
              <SearchInput
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="제목 또는 설명으로 검색"
                aria-label="검색"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 py-2 outline-none focus:border-brand-500"
              />
            </form>
            {res?.success ? (
              <span className="text-sm text-neutral-500">총 {res.total ?? res.items.length}개</span>
            ) : null}
          </div>

          {loading && <LoadingSpinner />}
          {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
          {res && !res.success && (
            <p className="text-red-600 dark:text-red-400">
              {res.message ?? '서버가 실패를 반환했습니다.'}
            </p>
          )}

          {res?.success ? (
            res.items.length === 0 ? (
              <p className="text-neutral-500">
                {debouncedKeyword ? '검색 결과가 없습니다.' : '등록된 항목이 없습니다.'}
              </p>
            ) : (
              <ul className={`space-y-3 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
                {res.items.map((item) => (
                  <SenseItem
                    key={item._id}
                    item={item}
                    action={<MySenseButton senseId={item._id} mode="remove" />}
                  />
                ))}
              </ul>
            )
          ) : null}

          {res?.success && res.hasNext ? (
            <div className="flex justify-center">
              <button type="button" className="btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
