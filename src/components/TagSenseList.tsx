import { useQuery } from '@apollo/client'
import { SENSE_LIST_BY_TAG_QUERY } from '@/graphql/queries/sense.ts'
import { SenseItem } from '@/components/SenseItem.tsx'
import { InterestTagButton } from '@/components/InterestTagButton.tsx'
import { MySenseButton } from '@/components/MySenseButton.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

// 태그별로 최신 5개만 보여준다. (API 최대 10, 커서가 없어서 더 보기는 지원하지 않는다.)
const SIZE = 5

/** 태그가 붙은 상식 목록. filter=my 면 내 상식 중에서만. */
export function TagSenseList({
  tag,
  filter = 'recent',
}: {
  tag: string
  filter?: 'recent' | 'my'
}) {
  const { data, loading, error } = useQuery(SENSE_LIST_BY_TAG_QUERY, {
    variables: { input: { name: tag, size: SIZE, filter } },
    fetchPolicy: 'cache-first',
  })
  const res = data?.SenseQuery.senseListByTag

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">
            <span className="text-brand-600 dark:text-indigo-300">#{tag}</span>
          </h2>
          {/* 내 상식(my) 에서는 관심 태그를 바로 뺄 수 있게 한다. */}
          <InterestTagButton tag={tag} removable={filter === 'my'} />
        </div>
        {res?.success && res.total != null ? (
          <span className="text-sm text-neutral-500">총 {res.total}개</span>
        ) : null}
      </div>

      {loading && !res && <LoadingSpinner />}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        res.items.length === 0 ? (
          <p className="text-neutral-500">
            {filter === 'my'
              ? '내 상식 중 이 태그가 붙은 항목이 없습니다.'
              : '이 태그가 붙은 상식이 아직 없습니다.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {res.items.map((item) => (
              <SenseItem
                key={item._id}
                item={item}
                action={
                  <MySenseButton senseId={item._id} mode={filter === 'my' ? 'remove' : 'add'} />
                }
              />
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}
