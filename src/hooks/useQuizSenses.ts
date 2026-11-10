import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { QUIZ_SENSES_BY_IDS_QUERY } from '@/graphql/queries/quiz.ts'
import { senseImagesOf, type QuizSenseCardData } from '@/lib/quiz.ts'

/** 퀴즈 문항들에 쓰인 상식을 id 로 한 번에 받아 카드 데이터로. */
export function useQuizSenses(items: readonly { senses: readonly { senses: string }[] }[]) {
  const ids = useMemo(
    () => [...new Set(items.flatMap((it) => it.senses.map((s) => s.senses)))].sort(),
    [items],
  )

  const { data, loading, error } = useQuery(QUIZ_SENSES_BY_IDS_QUERY, {
    variables: { input: { size: ids.length, search: { _id: { mul: ids } } } },
    skip: ids.length === 0,
  })

  const senses = useMemo(
    () =>
      new Map<string, QuizSenseCardData>(
        (data?.SenseQuery.senseStandardList.items ?? []).map((s) => [
          s._id,
          {
            _id: s._id,
            title: s.title,
            nativeLang: s.nativeLang,
            description: s.description,
            lv: s.lv,
            tags: s.tags.map((t) => ({ _id: t._id, name: t.name })),
            images: senseImagesOf(s.attaches),
          },
        ]),
      ),
    [data],
  )

  return { senses, loading: ids.length > 0 && loading && !data, error }
}
