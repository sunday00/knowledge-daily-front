import type { ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { NOTICE_ONE_QUERY } from '@/graphql/queries/notice.ts'
import type { NoticeOneQuery } from '@/graphql/__generated__/graphql.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { hasComponent } from '@/lib/components.ts'
import {
  isPinnedNotice,
  noticeCategoryLabel,
  noticeItemPath,
  NOTICE_CATEGORIES,
  NOTICE_PATH,
  NOTICE_TITLE,
} from '@/lib/notice.ts'
import type { OpinionTarget } from '@/lib/opinionTarget.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { ReactionBar } from '@/components/ReactionBar.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useCategoryParam, withCategory } from '@/components/board/CategoryTabs.tsx'
import { AdjacentNav } from '@/components/AdjacentNav.tsx'
import { BackToList } from '@/components/BackToList.tsx'

export type NoticeOneItem = NoticeOneQuery['NoticeQuery']['noticeOne']['item']

/** 공지에 붙일 기능. 관리자가 공지마다 components 로 고른다. */
export const hasNoticeComponent = (item: NoticeOneItem, name: 'Reaction' | 'Opinion') =>
  hasComponent(item.components, name)

/** 공지에 대화록을 달 때의 원글 */
export const noticeTarget = (item: NoticeOneItem): OpinionTarget => ({
  entity: 'Notice',
  id: item._id,
  path: noticeItemPath(item._id),
})

/**
 * 공지 한 건: 제목, 날짜, 본문(마크다운), (reaction 이면) 리액션 줄.
 * ACTIVE 인 공지면 게시 기간과 상관없이 보여준다. 그 아래 내용(대화록 등)은 children 으로.
 */
export function NoticeOneView({
  id,
  children,
}: {
  id: string
  children?: (item: NoticeOneItem) => ReactNode
}) {
  const category = useCategoryParam(NOTICE_CATEGORIES)
  const { data, loading, error } = useQuery(NOTICE_ONE_QUERY, {
    // 분류 탭에서 들어왔으면 이전/다음(pn)을 그 분류 안에서 찾는다.
    variables: { input: { _id: id, category } },
    fetchPolicy: 'cache-and-network',
  })
  const res = data?.NoticeQuery.noticeOne
  const found = res?.success ? res.item : null
  // 게시 기간과 상관없이 ACTIVE 면 보인다. (게시 기간은 고정 표시에만)
  const item = found && found.status === 'ACTIVE' ? found : null
  const categoryLabel = item && noticeCategoryLabel(item.category)
  const adjacentLink = (n?: { _id: string; title: string } | null) =>
    n ? { to: withCategory(noticeItemPath(n._id), category), title: n.title } : null

  return (
    // pb-32: 대화록이 있으면 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
    <div className={`space-y-8 ${item && hasNoticeComponent(item, 'Opinion') ? 'pb-32' : ''}`}>
      <article className="space-y-4">
        {/* 목록에서 왔으면 보던 페이지(?page=)로 돌아간다. */}
        <BackToList fallback={NOTICE_PATH}>{NOTICE_TITLE} 목록</BackToList>

        {loading && !res && <LoadingSpinner />}
        {/* 없는 공지면 서버가 item null 오류를 돌려준다. 게시 기간이 아닌 공지도 같은 안내. */}
        {((error && !res) || (res && !item)) && (
          <p className="text-neutral-500">공지를 찾을 수 없습니다.</p>
        )}

        {item && (
          <>
            <header className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="flex items-start gap-2 text-2xl font-semibold">
                {isPinnedNotice(item) && (
                  <span title="고정 공지" aria-label="고정 공지">
                    📌
                  </span>
                )}
                <span className="min-w-0 break-words">{item.title}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                {categoryLabel && (
                  <span className="rounded px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {categoryLabel}
                  </span>
                )}
                <time dateTime={String(item.createdAt)}>{formatDateTime(item.createdAt)}</time>
              </div>
            </header>

            <MarkdownView>{item.content}</MarkdownView>

            {hasNoticeComponent(item, 'Reaction') && (
              <ReactionBar target={{ entity: 'Notice', id: item._id }} />
            )}
          </>
        )}
      </article>

      {item && (
        <AdjacentNav prev={adjacentLink(res?.pn?.prev)} next={adjacentLink(res?.pn?.next)} />
      )}
      {item && children?.(item)}
    </div>
  )
}
