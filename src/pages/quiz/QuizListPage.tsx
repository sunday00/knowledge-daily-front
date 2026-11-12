import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { QUIZ_LIST_QUERY } from '@/graphql/queries/quiz.ts'
import type { QuizListQuery } from '@/graphql/__generated__/graphql.ts'
import {
  QUIZ_KEYWORD_PARAM,
  QUIZ_NEW_PATH,
  QUIZ_TITLE,
  quizEditPath,
  quizPath,
} from '@/lib/quiz.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { Pagination, PAGE_PARAM, usePageParam } from '@/components/Pagination.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { TagChips } from '@/components/TagChips.tsx'
import { QuizMyStatusBadge } from '@/components/quiz/QuizMyStatusBadge.tsx'
import { SearchInput } from '@/components/SearchInput.tsx'

type QuizListItem = QuizListQuery['QuizQuery']['quizList']['items'][number]

const SEARCH_DEBOUNCE_MS = 300

const PAGE_SIZE = 20

/** /quiz — 공개(ACTIVE) 퀴즈 최근순 목록 + 검색(?q=) + 내 퀴즈 만들기 */
export default function QuizListPage() {
  const { user } = useAuth()
  const page = usePageParam()
  const [params] = useSearchParams()
  const keyword = params.get(QUIZ_KEYWORD_PARAM)?.trim() ?? ''

  const { data, previousData, loading, error } = useQuery(QUIZ_LIST_QUERY, {
    variables: {
      input: {
        size: PAGE_SIZE,
        page,
        sort: { createdAt: -1 },
        // 서버 기본 필터가 없어 보내지 않으면 DRAFT 도 섞여 온다.
        // 검색어는 서버가 제목 / 태그 이름 부분일치, 상식 id(상식 자세히에서 옴)로 통합 검색 (escape 도 서버에서)
        search: {
          status: { eq: 'ACTIVE' },
          ...(keyword ? { keyword: { contains: keyword } } : {}),
        },
      },
    },
    fetchPolicy: 'cache-and-network',
  })
  // 페이지를 옮기는 동안엔 이전 페이지를 그대로 두어 화면이 비지 않게 한다.
  const res = (data ?? previousData)?.QuizQuery.quizList
  const maxPage = res?.maxPage || Math.ceil((res?.total ?? 0) / PAGE_SIZE)
  const items = res?.items ?? []

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{QUIZ_TITLE}</h2>
        {user && (
          <Link
            to={QUIZ_NEW_PATH}
            className="btn no-underline bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            내 퀴즈 만들기
          </Link>
        )}
      </div>

      <SearchForm keyword={keyword} />

      <div className={`space-y-4 ${loading && res ? 'opacity-60' : ''}`}>
        {res?.success && (
          <p className="text-sm text-neutral-500">총 {(res.total ?? 0).toLocaleString()}개</p>
        )}
        {loading && !res && <LoadingSpinner />}
        {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
        {res && !res.success && (
          <p className="text-red-600 dark:text-red-400">
            {res.message ?? '서버가 실패를 반환했습니다.'}
          </p>
        )}

        {res?.success ? (
          items.length === 0 ? (
            <p className="text-neutral-500">
              {keyword
                ? `'${keyword}' 에 맞는 퀴즈가 없습니다.`
                : page > 1
                  ? '이 페이지에는 퀴즈가 없습니다.'
                  : '아직 공개된 퀴즈가 없습니다.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <QuizCard key={item._id} item={item} mine={item.user?._id === user?.userId} />
              ))}
            </ul>
          )
        ) : null}

        {res?.success ? <Pagination page={page} maxPage={Math.max(maxPage, page)} /> : null}
      </div>
    </section>
  )
}

/**
 * 제목·태그 검색. 입력을 멈추면(디바운스) 바로 검색하고, Enter 는 기다리지 않고 바로.
 * 페이지는 1로. 입력 중엔 기록이 쌓이지 않게 주소를 replace 로 바꾼다.
 */
function SearchForm({ keyword }: { keyword: string }) {
  const [params, setParams] = useSearchParams()
  const [value, setValue] = useState(keyword)
  const debounced = useDebouncedValue(value.trim(), SEARCH_DEBOUNCE_MS)

  // 뒤로가기 / 상식 자세히에서 들어오는 등 주소가 바뀌면 입력칸도 맞춘다. (입력 중 끝 공백은 둔다)
  useEffect(() => setValue((v) => (v.trim() === keyword ? v : keyword)), [keyword])

  // 최신 주소 값은 ref 로 읽어, 주소가 바뀔 때가 아니라 입력이 멈췄을 때만 검색한다.
  const latest = useRef({ params, keyword })
  latest.current = { params, keyword }

  const apply = (q: string) => {
    const { params: current, keyword: applied } = latest.current
    if (q === applied) return
    const next = new URLSearchParams(current)
    next.delete(PAGE_PARAM)
    if (q) next.set(QUIZ_KEYWORD_PARAM, q)
    else next.delete(QUIZ_KEYWORD_PARAM)
    setParams(next, { replace: true })
  }

  useEffect(() => apply(debounced), [debounced])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    apply(value.trim())
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="퀴즈 제목, 태그로 검색"
        aria-label="퀴즈 검색"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 py-1.5 text-sm outline-none focus:border-brand-500"
      />
    </form>
  )
}

/** 제목 링크를 카드 전체로 늘려(after) 어디를 눌러도 풀기로. 태그·버튼은 그 위(z-1)에 둔다. */
function QuizCard({ item, mine }: { item: QuizListItem; mine: boolean }) {
  return (
    <li className="relative rounded-md border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold">
          <Link
            to={quizPath(item._id)}
            className="text-inherit no-underline after:content-empty after:absolute after:inset-0 after:rounded-md"
          >
            {item.title}
          </Link>
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <QuizMyStatusBadge status={item.me?.status} />
          <span className="rounded px-1.5 py-0.5 text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
            {item.quizItemsCnt.toLocaleString()}문항
          </span>
        </div>
      </div>
      {item.brief && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.brief}</p>
      )}
      <TagChips tags={item.tags} className="relative z-1 mt-2" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {item.user?.nickname && <span>{item.user.nickname} · </span>}
          {formatDateTime(item.createdAt)}
        </p>
        <div className="relative z-1 flex gap-1">
          {mine && (
            <Link to={quizEditPath(item._id)} className="btn text-xs px-2 py-1 no-underline">
              수정
            </Link>
          )}
          <Link
            to={quizPath(item._id)}
            className="btn text-xs px-2 py-1 no-underline bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            풀기
          </Link>
        </div>
      </div>
    </li>
  )
}
