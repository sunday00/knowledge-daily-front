import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { SenseStandardListQuery } from '@/graphql/__generated__/graphql.ts'
import { SenseCounts } from '@/components/SenseCounts.tsx'
import { TagChips } from '@/components/TagChips.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { rememberSenseListPath } from '@/lib/senseListReturn.ts'

// senseStandardList / senseMyList 가 같은 필드를 조회하므로 공용 타입으로 사용
export type SenseListItem =
  SenseStandardListQuery['SenseQuery']['senseStandardList']['items'][number]

export function SenseItem({
  item,
  rank,
  action,
}: {
  item: SenseListItem
  /** 순위 목록이면 제목 앞에 순위 */
  rank?: number
  /** 리액션 오른쪽에 둘 버튼 (예: 내 상식 추가/제외) */
  action?: ReactNode
}) {
  const location = useLocation()

  return (
    // 제목 링크를 카드 전체로 늘려(after) 어디를 눌러도 상세로 이동. 태그 링크와 리액션은 그 위(z-1)에 둔다.
    <li className="relative rounded-md border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          {rank !== undefined && (
            <span
              aria-label={`${rank}위`}
              className="shrink-0 text-base font-bold tabular-nums text-brand-600 dark:text-indigo-300"
            >
              {rank}
            </span>
          )}
          <h3 className="text-base font-semibold truncate">
            <Link
              to={`/sense/${item._id}`}
              onClick={() => rememberSenseListPath(location.pathname + location.search)}
              className="text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
            >
              {item.title}
            </Link>
          </h3>
          {item.nativeLang && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {item.nativeLang}
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs text-neutral-500">
          <SenseCounts opinionsCnt={item.opinionsCnt} />
          <span>Lv.{item.lv}</span>
        </div>
      </div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
      <TagChips tags={item.tags} className="mt-2 relative z-1" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <ReactionBar target={{ entity: 'Sense', id: item._id }} />
        {action && <div className="relative z-1">{action}</div>}
      </div>
    </li>
  )
}
