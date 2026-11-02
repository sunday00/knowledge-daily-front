import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@apollo/client'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { NicknameField } from '@/components/NicknameField.tsx'
import { LinksEditor } from '@/components/LinksEditor.tsx'
import { useUpdateUserSettings } from '@/actions/updateUserSettings.ts'
import { useUserInfoForm } from '@/hooks/useUserInfoForm.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { ProfileImojiPicker } from '@/components/profile/ProfileImojiPicker.tsx'

export default function UserSettingsEditPage() {
  const { user } = useAuth()
  const { nickname, setNickname, links, setLinks, loading } = useUserInfoForm()
  const { submit, saving, error } = useUpdateUserSettings()
  const imoji = useProfileImojiDraft()

  if (!user) return <Navigate to="/login" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: 프로필 이모지(imoji.value) 저장 mutation 이 생기면 같이 보낸다.
    void submit({ nickname, links })
  }

  return (
    <section className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">개인설정 수정</h2>

      {loading && <LoadingSpinner />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfileImojiPicker value={imoji.value} onChange={imoji.setValue} disabled={saving} />
        <NicknameField value={nickname} onChange={setNickname} disabled={saving} />
        <LinksEditor value={links} onChange={setLinks} disabled={saving} />

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to="/user/settings" className="btn">
            취소
          </Link>
        </div>
      </form>
    </section>
  )
}

/** 프로필 이모지 고르기 상태. 처음엔 지금 쓰는 이모지로 채운다. */
function useProfileImojiDraft() {
  const { data } = useQuery(ARCHIVE_MY_QUERY, { fetchPolicy: 'cache-first' })
  const [value, setValue] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const res = data?.ArchiveQuery.archiveUserOne
    if (res?.success && !initialized) {
      // 처음 만들어진 archive 는 img: null 로 온다.
      setValue(res.item.img?.current ?? null)
      setInitialized(true)
    }
  }, [data, initialized])

  return { value, setValue }
}
