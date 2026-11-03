import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useIsPaidUser } from '@/lib/paidUser.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { useEmbedActions, useMyEmbed, type EmbedIssued } from '@/actions/embedApply.ts'
import { CopyButton } from '@/components/CopyButton.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const BACK_TO = '/user/settings?tab=paid'

type MyEmbed = { allowedDomains: string[]; expiredAt: unknown }

/**
 * 임베드 이미지 상식: 신청 안 했으면 신청, 했으면 상태 보기 / 허용 도메인 수정 / 코드 재발급.
 * 신청·재발급 때 받은 코드/주소/img 태그는 그때만 볼 수 있어 복사 버튼을 둔다.
 */
export default function EmbedApplyPage() {
  const { user } = useAuth()
  const paid = useIsPaidUser()
  const my = useMyEmbed()
  const actions = useEmbedActions()

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">임베드 이미지 상식</h2>
        <p className="text-sm text-neutral-500">
          블로그 등에 이미지 태그를 붙여 두면, 내가 최근 받은 상식이 이미지로 보입니다.
        </p>
      </div>

      {!paid ? (
        <p className="text-neutral-500">유료 회원이 되면 신청할 수 있습니다.</p>
      ) : actions.issued ? (
        <IssuedResult issued={actions.issued} onDone={actions.clearIssued} />
      ) : my.loading ? (
        <LoadingSpinner />
      ) : my.error ? (
        <p className="text-red-600 dark:text-red-400">조회 실패: {my.error}</p>
      ) : my.embed ? (
        <Manage embed={my.embed} actions={actions} />
      ) : my.embed === null ? (
        <ApplyForm actions={actions} />
      ) : null}
    </section>
  )
}

type Actions = ReturnType<typeof useEmbedActions>

/** 허용 도메인 입력칸 (한 줄에 하나) */
function DomainsField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm text-neutral-700 dark:text-neutral-300">
        허용 도메인 (한 줄에 하나)
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder={'myblog.tistory.com\nblog.naver.com'}
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 font-mono text-sm outline-none focus:border-brand-500"
      />
      <span className="block text-xs text-neutral-500">
        적어 둔 사이트에서만 이미지가 보입니다. 비우면 어디서나 보입니다.
      </span>
    </label>
  )
}

const ErrorText = ({ error }: { error: string | null }) =>
  error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null

const primaryBtn =
  'inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60'

/** 아직 신청 안 함: 신청 */
function ApplyForm({ actions }: { actions: Actions }) {
  const [domains, setDomains] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!actions.busy) void actions.apply(domains)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DomainsField value={domains} onChange={setDomains} disabled={actions.busy} />
      <ErrorText error={actions.error} />
      <div className="flex gap-2">
        <button type="submit" disabled={actions.busy} className={primaryBtn}>
          {actions.busy ? '신청 중...' : '신청'}
        </button>
        <Link to={BACK_TO} className="btn">
          취소
        </Link>
      </div>
    </form>
  )
}

/** 신청함: 상태, 허용 도메인 수정, 코드 재발급 */
function Manage({ embed, actions }: { embed: MyEmbed; actions: Actions }) {
  const expired = Date.parse(embed.expiredAt as string) < Date.now()
  const saved = embed.allowedDomains.join('\n')
  const [domains, setDomains] = useState(saved)
  const [notice, setNotice] = useState<string | null>(null)
  // 서버 값이 바뀌면(저장 후 등) 입력칸도 맞춘다.
  useEffect(() => setDomains(saved), [saved])

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    if (actions.busy) return
    setNotice(null)
    void actions.updateDomains(domains).then((ok) => ok && setNotice('저장했습니다.'))
  }

  const handleReissue = () => {
    if (actions.busy) return
    const ok = window.confirm(
      '새 코드를 발급하면 예전 코드로 붙여 둔 이미지는 바로 보이지 않게 됩니다. 계속할까요?',
    )
    if (ok) void actions.reissue()
  }

  const handleRenew = () => {
    if (!actions.busy) void actions.apply(domains)
  }

  return (
    <div className="space-y-6">
      <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
        <div className="flex gap-4 px-4 py-3">
          <dt className="w-28 shrink-0 text-neutral-500">상태</dt>
          <dd>
            {expired ? (
              <span className="font-medium text-red-600 dark:text-red-400">기한 지남</span>
            ) : (
              <span className="font-medium text-green-700 dark:text-green-400">이용 중</span>
            )}
          </dd>
        </div>
        <div className="flex gap-4 px-4 py-3">
          <dt className="w-28 shrink-0 text-neutral-500">이용 기한</dt>
          <dd>
            <time dateTime={String(embed.expiredAt)}>{formatDateTime(embed.expiredAt)}</time>까지
          </dd>
        </div>
      </dl>

      {expired && (
        <div className="space-y-2 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm">
          <p className="text-red-700 dark:text-red-300">
            기한이 지나 붙여 둔 이미지에 서비스 종료 안내가 보입니다. 다시 신청하면 새 코드가
            발급됩니다.
          </p>
          <button
            type="button"
            onClick={handleRenew}
            disabled={actions.busy}
            className={primaryBtn}
          >
            다시 신청
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <h3 className="font-semibold">허용 도메인</h3>
        <DomainsField
          value={domains}
          onChange={(v) => {
            setDomains(v)
            setNotice(null)
          }}
          disabled={actions.busy}
        />
        <p className="text-xs text-neutral-500">바꿔도 코드와 붙여 둔 이미지는 그대로입니다.</p>
        {notice && <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>}
        <button type="submit" disabled={actions.busy || domains === saved} className={primaryBtn}>
          {actions.busy ? '처리 중...' : '저장'}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold">코드 재발급</h3>
        <p className="text-sm text-neutral-500">
          코드는 신청·재발급 때만 볼 수 있습니다. 잃어버렸거나 남에게 알려졌다면 새로 발급하세요.
          예전 코드로 붙여 둔 이미지는 새 이미지 태그로 바꿔야 합니다.
        </p>
        <button
          type="button"
          onClick={handleReissue}
          disabled={actions.busy}
          className="inline-flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
        >
          <WarningIcon />새 코드 발급
        </button>
      </div>

      <ErrorText error={actions.error} />

      <Link to={BACK_TO} className="btn">
        <BackIcon />
        개인설정으로
      </Link>
    </div>
  )
}

/** 신청/재발급 직후: 코드, 주소, img 태그를 복사할 수 있게 */
function IssuedResult({ issued, onDone }: { issued: EmbedIssued; onDone: () => void }) {
  return (
    <div className="space-y-5">
      <p className="rounded-md bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300">
        ⚠️ 아래 내용은 지금만 볼 수 있습니다. 화면을 떠나기 전에 복사해 두세요.
      </p>

      <CopyRow label="블로그에 붙일 이미지 태그" value={issued.imgHtml} multiline />
      <CopyRow label="이미지 주소" value={issued.src} />
      <CopyRow label="코드" value={issued.code} />

      <div className="space-y-1">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">미리보기</p>
        {/* 허용 도메인을 적었으면 우리 사이트는 목록에 없어 막힌다. 출처(Referer)를 안 보내면 서버가 도메인 검사를 건너뛴다. */}
        <SafeImage
          src={issued.src}
          referrerPolicy="no-referrer"
          alt="임베드 이미지 상식 미리보기"
          className="max-w-full rounded-md border border-neutral-200 dark:border-neutral-800"
        />
      </div>

      <button type="button" onClick={onDone} className="btn">
        복사했어요
      </button>
    </div>
  )
}

function CopyRow({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{label}</p>
      <div className="flex items-start gap-2">
        <code
          className={`min-w-0 flex-1 rounded-md bg-neutral-100 dark:bg-neutral-900 px-3 py-2 font-mono text-xs ${
            multiline ? 'whitespace-pre-wrap break-all' : 'truncate'
          }`}
          title={value}
        >
          {value}
        </code>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

/** 되돌아가기 아이콘 */
function BackIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

/** 위험(경고) 아이콘 */
function WarningIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
