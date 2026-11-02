import { useQuery } from '@apollo/client'
import { ARCHIVE_AVAILABLE_IMG_LIST_QUERY } from '@/graphql/queries/archive.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { ProfileImoji } from '@/components/profile/ProfileImoji.tsx'

// 한 번에 다 받아 그리드로 보인다. (목록이 이보다 커지면 페이지 넘김을 붙인다)
const SIZE = 100

type Props = {
  /** 고른 code. 없으면 null */
  value: string | null
  onChange: (code: string) => void
  disabled?: boolean
}

/** 고를 수 있는 프로필 이모지 중 하나를 고른다. */
export function ProfileImojiPicker({ value, onChange, disabled }: Props) {
  const { data, loading, error } = useQuery(ARCHIVE_AVAILABLE_IMG_LIST_QUERY, {
    variables: { input: { size: SIZE, sort: { createdAt: 1 } } },
    fetchPolicy: 'cache-first',
  })
  const res = data?.ArchiveQuery.archiveAvailableImgList

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
      {res?.success && res.items.length === 0 && (
        <p className="text-sm text-neutral-500">고를 수 있는 이모지가 없습니다.</p>
      )}

      {res?.success && res.items.length > 0 && (
        <div role="radiogroup" aria-label="프로필 이모지" className="flex flex-wrap gap-2">
          {res.items.map((img) => {
            const selected = img.code === value
            return (
              <button
                key={img.code}
                type="button"
                role="radio"
                aria-checked={selected}
                title={img.code}
                onClick={() => onChange(img.code)}
                className={`rounded-lg border-2 p-1.5 transition-colors disabled:opacity-60 ${
                  selected
                    ? 'border-brand-500 bg-brand-50 dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <ProfileImoji img={img} />
                <span className="sr-only">{img.code}</span>
              </button>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}
