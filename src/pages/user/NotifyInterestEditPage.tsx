import { type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { TagPicker } from '@/components/TagPicker.tsx'
import { NotiHourField } from '@/components/NotiHourField.tsx'
import { LevelRangeField } from '@/components/LevelRangeField.tsx'
import { useUpdateNotifyInterest } from '@/actions/updateNotifyInterest.ts'
import { useNotifyInterestForm } from '@/hooks/useNotifyInterestForm.ts'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

export default function NotifyInterestEditPage() {
  const { user } = useAuth()
  const { original, tags, setTags, notiHour, setNotiHour, lvs, setLvs, loading } =
    useNotifyInterestForm()
  const { submit, saving, error } = useUpdateNotifyInterest()

  if (!user) return <Navigate to="/login" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit(original, { tags, notiHour, lvs })
  }

  const disabled = saving || loading

  return (
    <section className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">내 관심 수정</h2>

      {loading && <LoadingSpinner />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <TagPicker value={tags} onChange={setTags} disabled={disabled} />
        <NotiHourField
          value={notiHour}
          onChange={setNotiHour}
          fromUtcH={original?.fromUtcH}
          disabled={disabled}
        />

        <LevelRangeField value={lvs} onChange={setLvs} disabled={disabled} />

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to="/user/settings?tab=interest" className="btn">
            취소
          </Link>
        </div>
      </form>
    </section>
  )
}
