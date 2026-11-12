import { ApolloError, useQuery } from '@apollo/client'
import { useParams, useSearchParams } from 'react-router-dom'
import { DOCUMENT_ONE_QUERY } from '@/graphql/queries/document.ts'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const NOT_FOUND = 'DOCUMENT_NOT_FOUND'

const formatDate = (value: unknown) =>
  new Date(value as string).toLocaleDateString('ko-KR', { dateStyle: 'long' })

/**
 * 개인정보처리방침, 이용약관, 소개 등 문서. 주소는 /documents/:slug
 * ?revision=N 이면 그 개정본(이미 시행된 것만), 없으면 지금 시행 중인 문서.
 */
export default function DocumentPage({ slug: slugProp }: { slug?: string }) {
  const params = useParams<{ slug: string }>()
  const slug = slugProp ?? params.slug ?? ''
  const [search] = useSearchParams()
  const revision = Number(search.get('revision')) || null

  const { data, loading, error } = useQuery(DOCUMENT_ONE_QUERY, {
    variables: { input: { slug, revision } },
    // 아직 없는 문서는 에러로 오지만 화면에서 안내하므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: [NOT_FOUND] },
  })
  const notFound =
    error instanceof ApolloError &&
    error.graphQLErrors.some((g) => g.extensions?.code === NOT_FOUND)
  const doc = data?.DocumentQuery.documentOne.item

  if (loading && !data) return <LoadingSpinner />
  if (notFound || (data && !doc)) {
    return <p className="text-neutral-500">아직 준비 중인 문서입니다.</p>
  }
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (!doc) return null

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h2 className="text-2xl font-semibold">{doc.title}</h2>
        <p className="text-sm text-neutral-500">
          <time dateTime={String(doc.effectiveAt)}>{formatDate(doc.effectiveAt)}</time> 시행
          {doc.revision > 1 && ` · 제${doc.revision}차 개정`}
        </p>
      </header>
      <MarkdownView>{doc.content}</MarkdownView>
    </article>
  )
}
