import { useCachedSenseList } from '@/hooks/useCachedSenseList.ts'
import { SenseItem } from './SenseItem'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

type Props = {
  size: number
}

export function SenseStandardList({ size }: Props) {
  const { data, loading, error } = useCachedSenseList(size)

  if (loading && !data) {
    return <LoadingSpinner />
  }

  if (error) {
    return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  }

  const res = data?.SenseQuery.senseStandardList
  if (!res || !res.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res?.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }

  if (res.items.length === 0) {
    return <p className="text-neutral-500">등록된 항목이 없습니다.</p>
  }

  return (
    <ul className="space-y-3">
      {res.items.map((item) => (
        <SenseItem key={item._id} item={item} />
      ))}
    </ul>
  )
}
