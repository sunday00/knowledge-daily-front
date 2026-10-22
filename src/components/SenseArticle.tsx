import type { ReactNode } from 'react'
import { useQuery } from '@apollo/client'
import { SENSE_ONE_QUERY } from '@/graphql/queries/sense.ts'
import type { SenseOneQuery } from '@/graphql/__generated__/graphql.ts'
import { SenseAttaches } from '@/components/SenseAttaches.tsx'
import { SenseCounts } from '@/components/SenseCounts.tsx'
import { TagChips } from '@/components/TagChips.tsx'
import { MarkdownView } from '@/components/MarkdownView.tsx'

export type SenseOneItem = SenseOneQuery['SenseQuery']['senseOne']['item']

/**
 * senseOne 을 조회해 상식 원글을 보여주고, 그 아래에 children(sense) 를 이어 붙인다.
 * 상식 상세 / 대화록 상세(의견 목록) 페이지가 같이 쓴다.
 */
export function SenseOneView({
  id,
  children,
}: {
  id: string
  children: (sense: SenseOneItem) => ReactNode
}) {
  const { data, loading, error } = useQuery(SENSE_ONE_QUERY, {
    variables: { input: { _id: id } },
    skip: !id,
  })
  const res = data?.SenseQuery.senseOne

  if (loading && !res) return <p className="text-neutral-500">불러오는 중...</p>
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!res) return null
  if (res.success === 4)
    return <p className="text-neutral-500">존재하지 않거나 삭제된 항목입니다.</p>
  if (res.success !== 1) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }

  // pb-32: 하단 고정 입력창에 마지막 항목이 가리지 않도록 여백
  return (
    <div className="space-y-8 pb-32">
      <SenseArticle sense={res.item} />
      {children(res.item)}
    </div>
  )
}

function SenseArticle({ sense }: { sense: SenseOneItem }) {
  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-2xl font-semibold">{sense.title}</h2>
          {sense.nativeLang && (
            <span className="text-neutral-500 dark:text-neutral-400">{sense.nativeLang}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <SenseCounts opinionsCnt={sense.opinionsCnt} />
          <span>Lv.{sense.lv}</span>
        </div>
        <TagChips tags={sense.tags} />
      </header>

      {/* 요약: 강조 상자로 본문과 구분 */}
      <section
        aria-label="요약"
        className="rounded-md border-l-4 border-brand-500 bg-brand-50 dark:bg-neutral-900 px-4 py-3"
      >
        <p className="text-lg leading-relaxed text-neutral-800 dark:text-neutral-200">
          {sense.description}
        </p>
      </section>

      <SenseAttaches attaches={sense.attaches} />

      {sense.detail && (
        <section className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <h3 className="text-sm font-semibold text-neutral-500">자세히</h3>
          <MarkdownView>{sense.detail}</MarkdownView>
        </section>
      )}
    </article>
  )
}
