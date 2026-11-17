import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { AGREEMENT_DOCUMENT_QUERY } from '@/graphql/queries/document.ts'
import { AGREE_DOCUMENTS_MUTATION } from '@/graphql/mutations/document.ts'
import { Modal, ModalButton } from '@/components/Modal.tsx'
import { MarkdownView } from '@/components/MarkdownView.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useSignOut } from '@/actions/signOut.ts'
import { setPendingAgreements } from '@/lib/agreement.ts'

/**
 * 로그인 유저가 동의하지 않은(또는 개정된) 문서가 있을 때 화면 전체 대신 띄우는 동의 받기 모달. 닫을 수 없다.
 * 문서마다 본문 + 동의 체크, 모두 체크해야 동의할 수 있다. 동의하지 않으려면 로그아웃.
 * 동의하면 대기를 풀어 원래 화면과 요청이 다시 돈다.
 */
export function AgreementGate({ slugs }: { slugs: string[] }) {
  const signOut = useSignOut()
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set())
  // 본문을 불러온 문서. 다 불러와야 '모두 동의' 할 수 있다
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set())
  const allLoaded = slugs.every((s) => loaded.has(s))
  const [error, setError] = useState<string | null>(null)
  const [agree, { loading }] = useMutation(AGREE_DOCUMENTS_MUTATION)
  const allChecked = slugs.every((s) => checked.has(s))

  const toggle = (slug: string, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(slug)
      else next.delete(slug)
      return next
    })

  const submit = async () => {
    setError(null)
    try {
      const { data } = await agree({ variables: { input: { slugs } } })
      const res = data?.DocumentMutation.documentAgree
      if (!res?.success) {
        setError(res?.message ?? '동의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      // 대기를 풀면 원래 화면이 다시 그려지며 막혔던 요청들이 다시 나간다
      setPendingAgreements(null)
    } catch {
      setError('동의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <Modal
      open
      // 닫을 수 없다 (동의하거나 로그아웃)
      onClose={() => {}}
      dismissible={false}
      locked
      wide
      icon={<span className="text-2xl">📄</span>}
      title="약관 동의가 필요해요"
      footer={
        <>
          <ModalButton onClick={signOut} disabled={loading}>
            로그아웃
          </ModalButton>
          {/* 문서를 다 불러와야 누를 수 있다. 다 체크돼 있으면 모두 해제 */}
          <ModalButton
            onClick={() => setChecked(new Set(allChecked ? [] : slugs))}
            disabled={loading || !allLoaded}
          >
            {allChecked ? '모두 해제' : '모두 동의'}
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={() => void submit()}
            disabled={!allChecked || loading}
          >
            {loading ? '저장 중…' : '동의하고 계속하기'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          새로 생기거나 바뀐 문서가 있어요. 내용을 확인하고 동의해 주세요.
        </p>
        {slugs.map((slug) => (
          <AgreementDocument
            key={slug}
            slug={slug}
            checked={checked.has(slug)}
            onCheck={(on) => toggle(slug, on)}
            onLoaded={() => setLoaded((prev) => (prev.has(slug) ? prev : new Set(prev).add(slug)))}
            disabled={loading}
          />
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

function AgreementDocument({
  slug,
  checked,
  onCheck,
  onLoaded,
  disabled,
}: {
  slug: string
  checked: boolean
  onCheck: (on: boolean) => void
  /** 본문을 불러왔을 때 */
  onLoaded: () => void
  disabled: boolean
}) {
  const { data, loading, error } = useQuery(AGREEMENT_DOCUMENT_QUERY, {
    variables: { input: { slug } },
  })
  const res = data?.DocumentQuery.documentOne
  const doc = res?.success ? res.item : null
  useEffect(() => {
    if (doc) onLoaded()
  }, [doc, onLoaded])

  return (
    <section className="space-y-2">
      <h3 className="font-semibold">
        {doc?.title ?? slug}
        {doc && (
          <span className="ml-2 text-xs font-normal text-neutral-500">
            {doc.revision}판 · {new Date(String(doc.effectiveAt)).toLocaleDateString('ko-KR')} 시행
          </span>
        )}
      </h3>
      <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
        {loading && !data ? (
          <LoadingSpinner size="sm" />
        ) : doc ? (
          <MarkdownView>{doc.content}</MarkdownView>
        ) : (
          <p className="text-red-600 dark:text-red-400">
            {error?.message ?? res?.message ?? '문서를 불러오지 못했습니다.'}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled || !doc}
          onChange={(e) => onCheck(e.target.checked)}
          className="accent-brand-600"
        />
        위 {doc?.title ?? '문서'}에 동의합니다.
      </label>
    </section>
  )
}
