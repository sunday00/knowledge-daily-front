import { Link, useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { OpinionItem } from '@/components/OpinionItem.tsx'
import { OpinionComposer } from '@/components/OpinionComposer.tsx'
import { useOpinionList } from '@/hooks/useOpinionList.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'

/** /sense/:id/threads/:threadId — 상식 원글 + 한 대화(thread)의 의견 목록 */
export default function ThreadOpinionsPage() {
  const { id = '', threadId = '' } = useParams<{ id: string; threadId: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <>
          <OpinionSection senseId={sense._id} threadId={threadId} />
          <OpinionComposer
            senseId={sense._id}
            parent={threadId}
            placeholder="이 대화에 의견을 남겨 보세요"
          />
        </>
      )}
    </SenseOneView>
  )
}

function OpinionSection({ senseId, threadId }: { senseId: string; threadId: string }) {
  const { res, loading, loadingMore, error, loadMore } = useOpinionList(threadId)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          대화
          {res?.success ? (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              의견 {res.total ?? res.items.length}
            </span>
          ) : null}
        </h3>
        <Link
          to={`/sense/${senseId}`}
          className="text-sm text-neutral-500 hover:text-brand-600 no-underline"
        >
          ← 대화록 전체 보기
        </Link>
      </div>

      {loading && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        res.items.length === 0 ? (
          <p className="text-neutral-500">아직 의견이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {res.items.map((opinion) => (
              <OpinionItem key={opinion._id} opinion={opinion} />
            ))}
          </ul>
        )
      ) : null}

      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <p className="text-center text-sm text-neutral-500">불러오는 중...</p>}
    </section>
  )
}
