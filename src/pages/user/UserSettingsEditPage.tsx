import { type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { NicknameField } from '@/components/NicknameField.tsx'
import { LinksEditor } from '@/components/LinksEditor.tsx'
import { useUpdateUserSettings } from '@/actions/updateUserSettings.ts'
import { useUserInfoForm } from '@/hooks/useUserInfoForm.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useProfileImoji } from '@/actions/profileImoji.ts'
import { ProfileImojiPicker } from '@/components/profile/ProfileImojiPicker.tsx'

export default function UserSettingsEditPage() {
  const { user } = useAuth()
  const { nickname, setNickname, links, setLinks, loading } = useUserInfoForm()
  const { submit, saving, error, nicknameError, clearNicknameError } = useUpdateUserSettings()
  const imoji = useProfileImoji()

  if (!user) return <Navigate to="/login" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit({ nickname, links })
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h2 className="text-xl font-semibold">개인설정 수정</h2>

      {loading && <LoadingSpinner />}

      {/* 프로필 이모지는 고르면 바로 적용된다. (아래 저장 버튼과 따로) */}
      <div className="space-y-1">
        <ProfileImojiPicker value={imoji.value} onChange={imoji.setValue} current={imoji.current} />
        <p aria-live="polite" className="min-h-5 text-sm">
          {imoji.error ? (
            <span className="text-red-600 dark:text-red-400">{imoji.error}</span>
          ) : imoji.applying ? (
            <span className="text-neutral-500">적용 중...</span>
          ) : null}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <NicknameField
          value={nickname}
          onChange={(next) => {
            setNickname(next)
            clearNicknameError()
          }}
          disabled={saving}
          error={nicknameError}
        />
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
