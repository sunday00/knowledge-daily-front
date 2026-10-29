import { useQuery } from '@apollo/client'
import { SENSE_OPINION_TOP_QUERY, SENSE_REACTION_TOP_QUERY } from '@/graphql/queries/top.ts'
import { POPULAR_REACTION_CODES } from '@/lib/reactions.ts'
import { SenseItem, type SenseListItem } from '@/components/SenseItem.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

type TopResult = {
  success: number
  message?: string | null
  // target 은 Sense 가 아니면 빈 객체, 삭제됐으면 null
  items: { targetId: string; target: SenseListItem | Record<PropertyKey, never> | null }[]
}

const isSense = (t: SenseListItem | Record<PropertyKey, never> | null): t is SenseListItem =>
  !!t && '_id' in t

/** 순위 목록 공통 화면. 삭제된 대상(target=null)은 건너뛴다. */
function RankedSenses({
  res,
  loading,
  error,
  empty,
}: {
  res: TopResult | undefined
  loading: boolean
  error?: Error
  empty: string
}) {
  if (loading && !res) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!res || !res.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res?.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }

  const senses = res.items.map((i) => i.target).filter(isSense)
  if (senses.length === 0) return <p className="text-neutral-500">{empty}</p>

  return (
    <ol className="space-y-3">
      {senses.map((item, i) => (
        <SenseItem key={item._id} item={item} rank={i + 1} />
      ))}
    </ol>
  )
}

/** 인기 상식: 긍정 리액션 점수 상위 */
export function SensePopularList({ size }: { size: number }) {
  const { data, loading, error } = useQuery(SENSE_REACTION_TOP_QUERY, {
    variables: { input: { targetEntity: 'Sense', names: POPULAR_REACTION_CODES, size } },
    fetchPolicy: 'cache-first',
  })
  return (
    <RankedSenses
      res={data?.ReactionQuery.reactionTopList}
      loading={loading}
      error={error}
      empty="아직 인기 상식이 없습니다."
    />
  )
}

/** 와글와글 상식: 의견 점수 상위 */
export function SenseBuzzList({ size }: { size: number }) {
  const { data, loading, error } = useQuery(SENSE_OPINION_TOP_QUERY, {
    variables: { input: { targetEntity: 'Sense', size } },
    fetchPolicy: 'cache-first',
  })
  return (
    <RankedSenses
      res={data?.OpinionQuery.opinionTopList}
      loading={loading}
      error={error}
      empty="아직 의견이 오간 상식이 없습니다."
    />
  )
}
