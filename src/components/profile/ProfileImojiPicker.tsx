import type { ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { ARCHIVE_MY_AVAILABLE_IMG_LIST_QUERY } from '@/graphql/queries/archive.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { ProfileImoji } from '@/components/profile/ProfileImoji.tsx'

// 한 번에 다 받아 그리드로 보인다. (목록이 이보다 커지면 페이지 넘김을 붙인다)
const SIZE = 100

type Props = {
  /** 고른 이모지 _id. 없음을 고르면 null */
  value: string | null
  onChange: (id: string | null) => void
  /** 지금 쓰고 있는 이모지 _id (내 archive 의 img.current). 없음이면 null, 아직 모르면 undefined */
  current?: string | null
  disabled?: boolean
}

/**
 * 내가 고를 수 있는 프로필 이모지 중 하나를 고른다. 맨 앞의 "없음" 을 고르면 이모지를 쓰지 않는다.
 * 지금 쓰는 이모지는 "사용 중" 으로 표시한다.
 */
export function ProfileImojiPicker({ value, onChange, current, disabled }: Props) {
  const { data, loading, error } = useQuery(ARCHIVE_MY_AVAILABLE_IMG_LIST_QUERY, {
    variables: { input: { size: SIZE, sort: { createdAt: 1 } } },
    // 고를 수 있는 이모지는 늘어날 수 있어 열 때마다 다시 확인한다.
    fetchPolicy: 'cache-and-network',
  })
  const res = data?.ArchiveQuery.archiveMyAvailableImgList

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1 text-sm text-neutral-700 dark:text-neutral-300">프로필 이모지</legend>

      {loading && !res && <LoadingSpinner size="sm" />}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
      )}
      {res && !res.success && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success && (
        <div role="radiogroup" aria-label="프로필 이모지" className="flex flex-wrap gap-2 pt-2">
          <Option
            label="없음"
            selected={value === null}
            inUse={current === null}
            onSelect={() => onChange(null)}
          >
            <span
              aria-hidden
              className="inline-flex h-10 w-10 items-center justify-center text-xs text-neutral-500"
            >
              없음
            </span>
          </Option>
          {res.items.map((img) => (
            <Option
              key={img._id}
              label={img.code}
              selected={img._id === value}
              inUse={img._id === current}
              onSelect={() => onChange(img._id)}
            >
              <ProfileImoji img={img} />
            </Option>
          ))}
        </div>
      )}
    </fieldset>
  )
}

function Option({
  label,
  selected,
  inUse,
  onSelect,
  children,
}: {
  label: string
  selected: boolean
  inUse: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={inUse ? `${label} (사용 중)` : label}
      onClick={onSelect}
      className={`relative rounded-lg border-2 p-1.5 transition-colors disabled:opacity-60 ${
        selected
          ? 'border-brand-500 bg-brand-50 dark:bg-neutral-800'
          : inUse
            ? 'border-dashed border-brand-500'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
      }`}
    >
      {children}
      <span className="sr-only">{inUse ? `${label} (사용 중)` : label}</span>
      {inUse && (
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-4 text-white"
        >
          사용 중
        </span>
      )}
    </button>
  )
}
