import { Link } from 'react-router-dom'
import { useCachedSenseList } from '@/hooks/useCachedSenseList.ts'

type Props = {
  size: number
}

export function SenseStandardList({ size }: Props) {
  const { data, loading, error } = useCachedSenseList(size)

  if (loading && !data) {
    return <p className="text-neutral-500">불러오는 중...</p>
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
        <li
          key={item._id}
          className="rounded-md border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <h3 className="text-base font-semibold truncate">{item.title}</h3>
              {item.nativeLang && (
                <span className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {item.nativeLang}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-neutral-500">Lv.{item.lv}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
          {item.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <li key={t._id}>
                  <Link
                    to={`/sense/tag/${encodeURIComponent(t.name)}`}
                    className="text-xs rounded-full px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 dark:hover:bg-neutral-700 hover:text-brand-700 dark:hover:text-brand-500 no-underline transition-colors"
                  >
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
