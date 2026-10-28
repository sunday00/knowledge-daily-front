import { useAuth } from '@/auth/AuthProvider.tsx'
import { useAddMySense, useRemoveMySense } from '@/actions/mySense.ts'
import { SaveIcon } from '@/components/SaveIcon.tsx'
import { TrashIcon } from '@/components/TrashIcon.tsx'

// 아이콘만 보이는 작은 버튼. 설명은 title(툴팁)과 aria-label 로 한다.
const ICON_BTN =
  'inline-flex items-center justify-center rounded-md p-1.5 text-neutral-500 dark:text-neutral-400 transition-colors disabled:opacity-50'

/** 상식 카드의 내 상식 추가(디스켓)/제외(휴지통) 버튼. 로그인 사용자에게만 보인다. */
export function MySenseButton({ senseId, mode }: { senseId: string; mode: 'add' | 'remove' }) {
  const { user } = useAuth()
  if (!user) return null
  return mode === 'add' ? <AddButton senseId={senseId} /> : <RemoveButton senseId={senseId} />
}

function AddButton({ senseId }: { senseId: string }) {
  const { add, added, loading } = useAddMySense()
  const label = added ? '내 상식에 추가됨' : loading ? '추가 중...' : '내 상식에 추가'
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => void add(senseId)}
      disabled={loading || added}
      className={`${ICON_BTN} ${
        added
          ? 'text-brand-600 dark:text-indigo-300'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-brand-600 dark:hover:text-indigo-300'
      }`}
    >
      <SaveIcon />
    </button>
  )
}

function RemoveButton({ senseId }: { senseId: string }) {
  const { remove, loading } = useRemoveMySense()
  const label = loading ? '제외 중...' : '내 상식에서 제외'
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => void remove(senseId)}
      disabled={loading}
      className={`${ICON_BTN} hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
    >
      <TrashIcon />
    </button>
  )
}
