import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { usePromotionCodeUse } from '@/actions/promotionCodeUse.ts'

type PromotionTab = 'code'

const TAB_PARAM = 'tab'
const TABS: { key: PromotionTab; label: string }[] = [{ key: 'code', label: '프로모션 코드' }]
const DEFAULT_TAB: PromotionTab = 'code'

/** /user/promotion — 프로모션. 탭: 프로모션 코드 */
export default function PromotionPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const raw = params.get(TAB_PARAM)
  const tab = TABS.find((t) => t.key === raw)?.key ?? DEFAULT_TAB

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">프로모션</h2>
      <PromotionTabs current={tab} />
      {tab === 'code' && <PromotionCodeForm />}
    </section>
  )
}

function PromotionTabs({ current }: { current: PromotionTab }) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="프로모션 분류"
      className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800"
    >
      {TABS.map((t) => {
        const active = t.key === current
        return (
          <Link
            key={t.key}
            to={t.key === DEFAULT_TAB ? pathname : `${pathname}?${TAB_PARAM}=${t.key}`}
            replace
            aria-current={active ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm no-underline transition-colors ${
              active
                ? 'border-brand-600 font-medium text-brand-600 dark:border-indigo-300 dark:text-indigo-300'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

function PromotionCodeForm() {
  const [code, setCode] = useState('')
  const { use, loading, result } = usePromotionCodeUse()
  const trimmed = code.trim()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || loading) return
    if (await use(trimmed)) setCode('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label
        htmlFor="promotion-code"
        className="block text-sm text-neutral-600 dark:text-neutral-400"
      >
        받은 프로모션 코드를 입력하면 포인트가 적립됩니다.
      </label>
      <p id="promotion-code-hint" className="text-xs text-neutral-500">
        영문은 자동으로 대문자로 입력됩니다. Caps Lock 이 켜진 것이 아니니 그대로 입력하세요.
      </p>
      <div className="flex gap-2">
        <input
          id="promotion-code"
          aria-describedby="promotion-code-hint"
          type="text"
          value={code}
          // 영문은 입력하는 대로 대문자로 바꿔 보여 주고 그대로 보낸다
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="프로모션 코드"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={100}
          className="min-w-0 flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 font-mono"
        />
        <button type="submit" className="btn shrink-0" disabled={!trimmed || loading}>
          {loading ? '확인 중…' : '등록'}
        </button>
      </div>
      {result && (
        <p
          role="status"
          className={`text-sm ${
            result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {result.message}
        </p>
      )}
    </form>
  )
}
