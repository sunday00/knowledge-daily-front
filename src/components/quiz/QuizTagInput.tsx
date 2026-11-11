import { useState, type KeyboardEvent } from 'react'
import { useQuery } from '@apollo/client'
import { TAG_STANDARD_LIST_QUERY } from '@/graphql/queries/tag.ts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { HASHTAG_MAX_LENGTH } from '@/lib/hashtags.ts'

/** 퀴즈에 붙일 태그 최대 개수 */
export const QUIZ_TAGS_MAX = 10
const SUGGEST_SIZE = 8

/** 입력값 → 태그 이름. 앞의 # 과 공백은 떼고, 게시글 #태그와 같은 글자(글자·숫자·_)만 남긴다. */
const tagNameOf = (raw: string) =>
  raw
    .trim()
    .replace(/^#+/, '')
    .replace(/[^\p{L}\p{N}_]/gu, '')
    .slice(0, HASHTAG_MAX_LENGTH)

/**
 * 태그 이름 입력. Enter·쉼표로 추가하고, 비슷한 기존 태그를 아래에 추천한다.
 * 서버가 없는 태그는 새로 만들어 연결하므로 이름만 보낸다.
 */
export function QuizTagInput({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const [text, setText] = useState('')
  const keyword = useDebouncedValue(tagNameOf(text), 300)
  const full = value.length >= QUIZ_TAGS_MAX

  const { data } = useQuery(TAG_STANDARD_LIST_QUERY, {
    variables: { input: { size: SUGGEST_SIZE, search: { name: { contains: keyword } } } },
    skip: !keyword,
  })
  const suggestions = keyword
    ? (data?.TagQuery.tagStandardList.items ?? []).filter((t) => !value.includes(t.name))
    : []

  const add = (raw: string) => {
    const name = tagNameOf(raw)
    setText('')
    if (!name || /^\d+$/.test(name) || value.includes(name) || full) return
    onChange([...value, name])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter 는 조합 확정이라 무시
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 focus-within:border-brand-500">
        {value.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(value.filter((n) => n !== name))}
            disabled={disabled}
            aria-label={`${name} 빼기`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
          >
            #{name} <span aria-hidden>×</span>
          </button>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => text && add(text)}
          disabled={disabled || full}
          aria-label="태그 입력"
          placeholder={full ? `태그는 ${QUIZ_TAGS_MAX}개까지` : '태그 입력 후 Enter'}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>

      {suggestions.length > 0 && !full && (
        <ul className="flex flex-wrap gap-1.5" aria-label="추천 태그">
          {suggestions.map((t) => (
            <li key={t._id}>
              <button
                type="button"
                // 입력칸 blur 보다 먼저 눌리게
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(t.name)}
                disabled={disabled}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                #{t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
