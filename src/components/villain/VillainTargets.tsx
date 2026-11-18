import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import {
  MY_ARTICLE_LIST_QUERY,
  MY_OPINION_LIST_QUERY,
  MY_QUIZ_LIST_QUERY,
} from '@/graphql/queries/my.ts'
import { USER_ARCHIVE_QUERY } from '@/graphql/queries/villain.ts'
import { useOpinionPaths } from '@/hooks/useOpinionPaths.ts'
import { UserAvatar } from '@/components/profile/UserAvatar.tsx'
import { articlePathOf } from '@/lib/myRecord.ts'
import { quizPath } from '@/lib/quiz.ts'
import { unmaskedOf } from '@/lib/blockedContent.ts'
import { TARGET_LABEL, type BlockEntity } from '@/lib/villainManage.ts'

type TargetRef = { targetEntity: string; targetId: string }

/** 차단 / 신고 대상 한 건의 표시. path 가 없으면 링크 없이 */
export type TargetView = { label: string; path: string | null; deleted: boolean }

const byIds = (ids: string[]) => ({
  variables: { input: { size: ids.length, search: { _id: { mul: ids } } } },
  skip: ids.length === 0,
})

const uniq = (list: string[]) => [...new Set(list)]

/** 서버가 목록에서 가린 값(내가 차단 / 삭제)을 벗겨 원래 내용으로. 삭제면 '삭제된 ○○' */
const viewOf = (value: string, noun: string, path: string | null): TargetView => {
  const { deleted, text } = unmaskedOf(value)
  return deleted
    ? { label: `삭제된 ${noun}입니다.`, path: null, deleted: true }
    : { label: text, path, deleted: false }
}

/**
 * 한 쪽 분량의 차단 / 신고 대상(게시글 / 의견 / 퀴즈)을 종류별로 한 번씩 조회해 표시로 바꾼다.
 * 유저는 여러 명을 한 번에 찾는 쿼리가 없어 UserTargetLabel 이 한 명씩 조회한다.
 */
export function useBlockTargets(refs: readonly TargetRef[]) {
  const idsOf = (entity: BlockEntity) =>
    uniq(refs.filter((r) => r.targetEntity === entity).map((r) => r.targetId))

  const articles = useQuery(MY_ARTICLE_LIST_QUERY, byIds(idsOf('Article')))
  const opinions = useQuery(MY_OPINION_LIST_QUERY, byIds(idsOf('Opinion')))
  const quizzes = useQuery(MY_QUIZ_LIST_QUERY, byIds(idsOf('Quiz')))
  const opinionItems = opinions.data?.OpinionQuery.opinionStandardList.items ?? []
  const opinionPaths = useOpinionPaths(opinionItems)

  const views = new Map<string, TargetView>()
  for (const a of articles.data?.BoardQuery.articleList.items ?? []) {
    views.set(a._id, viewOf(a.title, '글', articlePathOf(a)))
  }
  for (const o of opinionItems) {
    views.set(o._id, viewOf(o.content, '의견', opinionPaths.get(o._id) ?? null))
  }
  for (const q of quizzes.data?.QuizQuery.quizList.items ?? []) {
    views.set(q._id, viewOf(q.title, '퀴즈', quizPath(q._id)))
  }
  const loading = articles.loading || opinions.loading || quizzes.loading
  return { views, loading }
}

/** 대상 한 건: 종류 표시 + 내용(누르면 상세로). 유저는 한 명씩 조회 */
export function TargetLabel({
  target,
  views,
  loading,
}: {
  target: TargetRef
  views: Map<string, TargetView>
  loading: boolean
}) {
  const entity = target.targetEntity as BlockEntity
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {TARGET_LABEL[entity] ?? target.targetEntity}
      </span>
      {entity === 'User' ? (
        <UserTargetLabel userId={target.targetId} />
      ) : (
        <ContentTargetLabel view={views.get(target.targetId)} loading={loading} />
      )}
    </span>
  )
}

function ContentTargetLabel({ view, loading }: { view?: TargetView; loading: boolean }) {
  if (!view) {
    return (
      <span className="text-sm italic text-neutral-400">
        {loading ? '불러오는 중…' : '찾을 수 없는 대상입니다.'}
      </span>
    )
  }
  const text = <span className="line-clamp-1 break-all">{view.label}</span>
  if (view.deleted) return <span className="text-sm italic text-neutral-400">{view.label}</span>
  return view.path ? (
    <Link
      to={view.path}
      className="min-w-0 text-sm text-neutral-900 no-underline hover:underline dark:text-neutral-100"
    >
      {text}
    </Link>
  ) : (
    <span className="min-w-0 text-sm">{text}</span>
  )
}

function UserTargetLabel({ userId }: { userId: string }) {
  const { data, loading } = useQuery(USER_ARCHIVE_QUERY, {
    variables: { input: { userId } },
    fetchPolicy: 'cache-first',
  })
  const archive = data?.ArchiveQuery.archiveUserOne.item
  const user = archive?.user
  if (loading && !data) return <span className="text-sm italic text-neutral-400">불러오는 중…</span>
  if (!user)
    return <span className="text-sm italic text-neutral-400">찾을 수 없는 유저입니다.</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-sm">
      <UserAvatar archive={archive} size={20} />
      <span className="truncate">
        {user.status === 'INACTIVE' ? '탈퇴한 사용자' : user.nickname}
      </span>
    </span>
  )
}
