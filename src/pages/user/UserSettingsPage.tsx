import { useQuery } from '@apollo/client'
import { Link, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { USER_INFO_QUERY } from '@/graphql/queries/userInfo.ts'
import { useAuth } from '../../auth/AuthProvider'
import { LinkItem } from '../../components/LinkItem'

export default function UserSettingsPage() {
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

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">개인설정</h2>
        <Link to="/user/settings/edit" className="btn">
          수정
        </Link>
      </div>

      {loading && !item && <p className="text-neutral-500">불러오는 중...</p>}
      {error && <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {info && !info.success && (
        <p className="text-red-600 dark:text-red-400">
          {info.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}

      {item && (
        <dl className="rounded-md border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <Row label="ID" value={item._id} mono />
          <Row label="SID" value={String(item.sid)} mono />
          <Row label="닉네임" value={item.nickname} />
          <Row label="레벨" value={String(item.lv)} />
          <Row label="역할" value={item.roles.join(', ') || '(없음)'} />
          <Row label="상태" value={item.status} />
          <Row label="가입일" value={new Date(item.createdAt as string).toLocaleString()} />

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
    </section>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-28 shrink-0 text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={mono ? 'font-mono text-sm break-all' : ''}>{value}</dd>
    </div>
  )
}
