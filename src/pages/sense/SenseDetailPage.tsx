import { useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { OpinionComposer } from '@/components/OpinionComposer.tsx'
import { ThreadItem } from '@/components/ThreadItem.tsx'
import { useThreadList } from '@/hooks/useThreadList.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'

export default function SenseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <>
          <ThreadSection senseId={sense._id} />
          <OpinionComposer senseId={sense._id} placeholder="새 대화를 시작해 보세요" />
        </>
      )}
    </SenseOneView>
  )
}

function ThreadSection({ senseId }: { senseId: string }) {
  const { res, loading, loadingMore, error, loadMore } = useThreadList(senseId)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">
        대화록
        {res?.success ? (
          <span className="ml-2 text-sm font-normal text-neutral-500">
            {res.total ?? res.items.length}
          </span>
        ) : null}
      </h3>

      {loading && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {res?.success ? (
        res.items.length === 0 ? (
          <p className="text-neutral-500">아직 대화가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {res.items.map((thread) => (
              <ThreadItem key={thread._id} thread={thread} senseId={senseId} />
            ))}
          </ul>
        )
      ) : null}

      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <p className="text-center text-sm text-neutral-500">불러오는 중...</p>}
    </section>
  )
}
