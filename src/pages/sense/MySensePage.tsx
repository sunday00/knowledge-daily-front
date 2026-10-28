import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { SenseItem } from '@/components/SenseItem.tsx'
import { MyTagSidebar } from '@/components/MyTagSidebar.tsx'
import { TagSenseList } from '@/components/TagSenseList.tsx'
import { MySenseButton } from '@/components/MySenseButton.tsx'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { useSenseMyList } from '@/hooks/useSenseMyList.ts'

export default function MySensePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag') ?? undefined
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const { res, loading, refreshing, loadingMore, error, loadMore } =
    useSenseMyList(debouncedKeyword)

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <MyTagSidebar active={tag} />
      <div className="min-w-0 flex-1">
        {tag ? (
          <TagSenseList tag={tag} filter="my" />
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">내 Knowledge</h2>
              {res?.success ? (
                <span className="text-sm text-neutral-500">
                  총 {res.total ?? res.items.length}개
                </span>
              ) : null}
            </div>

            <form role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="제목 또는 설명으로 검색"
                aria-label="검색"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
              />
            </form>

            {loading && <p className="text-neutral-500">불러오는 중...</p>}
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
          </section>
        )}
      </div>
    </div>
  )
}
