import { useQuery } from '@apollo/client'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { USER_INFO_QUERY } from '@/graphql/queries/userInfo.ts'
import { useAuth } from '../../auth/AuthProvider'
import { LinkItem } from '../../components/LinkItem'
import { InfoRow } from '../../components/InfoRow'
import { NotifyInterest } from '../../components/NotifyInterest'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

const TABS = [
  { key: 'basic', label: '기본정보', editTo: '/user/settings/edit' },
  { key: 'interest', label: '내 관심', editTo: '/user/settings/interest/edit' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function UserSettingsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  // 새로고침/뒤로가기에도 탭이 유지되도록 URL 에 둔다.
  const tab: TabKey = params.get('tab') === 'interest' ? 'interest' : 'basic'

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">개인설정</h2>
        <Link to={TABS.find((t) => t.key === tab)!.editTo} className="btn">
          수정
        </Link>
      </div>

      <div
        role="tablist"
        className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800"
      >
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParams(t.key === 'basic' ? {} : { tab: t.key }, { replace: true })}
              className={`-mb-px border-b-2 px-4 py-2 font-medium transition-colors ${
                active
                  ? 'border-brand-500 text-brand-600 dark:text-brand-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'basic' ? <BasicInfo /> : <NotifyInterest />}
    </section>
  )
}

function BasicInfo() {
  const { user, updateUser } = useAuth()
  const { data, loading, error } = useQuery(USER_INFO_QUERY, {
    fetchPolicy: 'cache-and-network',
  })

  const info = data?.UserQuery.info
  const item = info?.item

  // 서버 nickname 과 로컬이 다르면 로컬 동기화 (다른 기기/탭 변경 커버)
  useEffect(() => {
    if (!user || !item) return
    if (item.nickname !== user.nickname) {
      updateUser({ nickname: item.nickname })
    }
  }, [user, item, updateUser])

  return (
    <div className="space-y-4">
      {loading && !item && <LoadingSpinner />}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {info && !info.success && (
        <p className="text-red-600 dark:text-red-400">
          {info.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {item && (
        <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <InfoRow label="ID" mono>
            {item._id}
          </InfoRow>
          <InfoRow label="SID" mono>
            {String(item.sid)}
          </InfoRow>
          <InfoRow label="닉네임">{item.nickname}</InfoRow>
          <InfoRow label="레벨">{String(item.lv)}</InfoRow>
          <InfoRow label="역할">{item.roles.join(', ') || '(없음)'}</InfoRow>
          <InfoRow label="상태">{item.status}</InfoRow>
          <InfoRow label="가입일">{new Date(item.createdAt as string).toLocaleString()}</InfoRow>

          {item.links.length > 0 && (
            <div className="px-4 py-3">
              <div className="w-28 shrink-0 text-neutral-500 dark:text-neutral-400 mb-2">링크</div>
              <ul className="space-y-1.5 text-sm">
                {item.links.map((l, i) => (
                  <LinkItem key={i} href={l.href} label={l.label} />
                ))}
              </ul>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
