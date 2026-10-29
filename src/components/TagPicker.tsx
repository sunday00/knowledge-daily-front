import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { TAG_STANDARD_LIST_QUERY } from '@/graphql/queries/tag.ts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

export type TagOption = { _id: string; name: string }

type Props = {
  value: TagOption[]
  onChange: (next: TagOption[]) => void
  disabled?: boolean
}

const PAGE_SIZE = 20

export function TagPicker({ value, onChange, disabled }: Props) {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)

  const { data, previousData, loading } = useQuery(TAG_STANDARD_LIST_QUERY, {
    variables: {
      input: {
        size: PAGE_SIZE,
        search: debouncedKeyword ? { name: { contains: debouncedKeyword } } : undefined,
      },
    },
  })
  // 새 결과가 오기 전까지 이전 결과를 유지해 목록이 깜빡이지 않게 한다.
  const options = (data ?? previousData)?.TagQuery.tagStandardList.items ?? []
  const selectedIds = new Set(value.map((t) => t._id))

  const toggle = (tag: TagOption) => {
    onChange(
      selectedIds.has(tag._id)
        ? value.filter((t) => t._id !== tag._id)
        : [...value, { _id: tag._id, name: tag.name }],
    )
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm text-neutral-700 dark:text-neutral-300">관심 태그</span>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t._id}>
              <button
                type="button"
                onClick={() => toggle(t)}
                disabled={disabled}
                aria-label={`${t.name} 빼기`}
                className="inline-flex items-center gap-1 text-sm rounded-full px-2.5 py-0.5 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                #{t.name} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">선택된 태그가 없습니다.</p>
      )}

      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        disabled={disabled}
        placeholder="태그 검색"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
      />

      <div className="min-h-10">
        {loading && options.length === 0 ? (
          <LoadingSpinner size="sm" />
        ) : options.length === 0 ? (
          <p className="text-sm text-neutral-500">검색 결과가 없습니다.</p>
        ) : (
          <ul className={`flex flex-wrap gap-1.5 ${loading ? 'opacity-60' : ''}`}>
            {options.map((t) => {
              const selected = selectedIds.has(t._id)
              return (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => toggle(t)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={`text-sm rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-60 ${
                      selected
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-neutral-800 dark:text-brand-500'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    #{t.name}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
