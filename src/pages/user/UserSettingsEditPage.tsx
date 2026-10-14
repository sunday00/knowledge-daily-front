import { type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { NicknameField } from '@/components/NicknameField.tsx'
import { LinksEditor } from '@/components/LinksEditor.tsx'
import { useUpdateUserSettings } from '@/actions/updateUserSettings.ts'
import { useUserInfoForm } from '@/hooks/useUserInfoForm.ts'

export default function UserSettingsEditPage() {
  const { user } = useAuth()
  const { nickname, setNickname, links, setLinks, loading } = useUserInfoForm()
  const { submit, saving, error } = useUpdateUserSettings()

  if (!user) return <Navigate to="/login" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit({ nickname, links })
  }

  return (
    <section className="space-y-4 max-w-xl">
      <h1 className="text-3xl font-bold">개인설정 수정</h1>

      {loading && <p className="text-neutral-500">불러오는 중...</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
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
