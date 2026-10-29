import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { TAG_TOP_FOCUS_LIST_QUERY } from '@/graphql/queries/tag.ts'
import { TagSidebar } from '@/components/TagSidebar.tsx'
import { TagSenseList } from '@/components/TagSenseList.tsx'
import { FlameIcon } from '@/components/FlameIcon.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const POPULAR_SIZE = 5

export default function TagsPage() {
  const { tag } = useParams<{ tag?: string }>()

  const { data, loading, error } = useQuery(TAG_TOP_FOCUS_LIST_QUERY, {
    variables: { input: { size: POPULAR_SIZE } },
    fetchPolicy: 'cache-first',
  })
  const res = data?.TagQuery.tagTopFocusList
  const popular = useMemo(() => (res?.success ? res.items.map((i) => i.tag) : []), [res])

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <TagSidebar active={tag} popular={popular} />
      <div className="min-w-0 flex-1">
        {tag ? (
          <TagSenseList tag={tag} />
        ) : (
          <section className="space-y-4 rounded-lg border-2 border-brand-500/40 dark:border-indigo-400/40 p-5">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FlameIcon size={20} className="text-orange-500 dark:text-orange-400" />
              이런 주제는 어떤가요?
            </h2>
            {loading && !res && <LoadingSpinner />}
            {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
            {res && !res.success && (
              <p className="text-red-600 dark:text-red-400">
                {res.message ?? '서버가 실패를 반환했습니다.'}
              </p>
            )}
            {res?.success &&
              (popular.length === 0 ? (
                <p className="text-neutral-500">아직 인기 태그가 없습니다.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {popular.map((t) => (
                    <li key={t._id}>
                      <Link
                        to={`/tags/${encodeURIComponent(t.name)}`}
                        className="inline-block rounded-full px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-medium no-underline hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                      >
                        #{t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            <p className="text-sm text-neutral-500">
              태그 목록에서 태그를 고르면 관련 상식을 볼 수 있어요.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
