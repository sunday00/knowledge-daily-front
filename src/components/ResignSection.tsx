import { useState } from 'react'
import { Modal, ModalButton } from '@/components/Modal.tsx'
import { useResign } from '@/actions/resign.ts'
import { CharCount } from '@/components/CharCount.tsx'
import {
  REJOIN_RESTRICT_DAYS,
  RESIGN_REASONS,
  RESIGN_REASON_MAX_LENGTH,
  RESIGN_REASON_OTHER,
} from '@/lib/resign.ts'

// 실수로 누르지 않도록 이 글자를 직접 입력해야 탈퇴 버튼이 켜진다
const CONFIRM_WORD = '탈퇴'

/** 개인설정 맨 아래 회원 탈퇴. 눈에 덜 띄게 두고, 누르면 확인 모달 */
export function ResignSection() {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  // 사유(선택). 고른 선택지, 기타면 직접 입력한 글
  const [choice, setChoice] = useState<string | null>(null)
  const [other, setOther] = useState('')
  const { resign, loading, error } = useResign()

  const close = () => {
    if (loading) return
    setOpen(false)
    setTyped('')
    setChoice(null)
    setOther('')
  }

  // 고르지 않았거나 기타를 비워 두면 사유 없이 보낸다
  const reason = choice === RESIGN_REASON_OTHER ? other.trim() || null : choice

  return (
    <div className="border-t border-neutral-200 pt-6 text-right dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-400 underline-offset-2 hover:text-red-600 hover:underline dark:text-neutral-500 dark:hover:text-red-400"
      >
        회원 탈퇴
      </button>

      <Modal
        open={open}
        onClose={close}
        tone="danger"
        title="정말 탈퇴할까요?"
        dismissible={!loading}
        footer={
          <>
            <ModalButton onClick={close} disabled={loading}>
              취소
            </ModalButton>
            <ModalButton
              variant="danger"
              onClick={() => void resign(reason)}
              disabled={loading || typed.trim() !== CONFIRM_WORD}
            >
              {loading ? '탈퇴 중…' : '탈퇴하기'}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3 text-left text-sm">
          <ul className="list-disc space-y-1 pl-5">
            <li>포인트, 도전과제, 칭호 등 계정 데이터는 복구되지 않습니다.</li>
            <li>같은 계정으로 다시 가입하려면 {REJOIN_RESTRICT_DAYS}일이 지나야 합니다.</li>
          </ul>
          <fieldset className="space-y-1.5" disabled={loading}>
            <legend className="mb-1 text-neutral-600 dark:text-neutral-400">
              떠나시는 이유를 알려 주시면 더 나은 서비스를 만드는 데 쓸게요. (선택)
            </legend>
            {[...RESIGN_REASONS, RESIGN_REASON_OTHER].map((r) => (
              <label
                key={r}
                className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300"
              >
                <input
                  type="radio"
                  name="resign-reason"
                  value={r}
                  checked={choice === r}
                  onChange={() => setChoice(r)}
                  className="accent-brand-600"
                />
                {r}
              </label>
            ))}
            {choice === RESIGN_REASON_OTHER && (
              <div className="space-y-1">
                <textarea
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  rows={3}
                  maxLength={RESIGN_REASON_MAX_LENGTH}
                  placeholder="자유롭게 적어 주세요"
                  aria-label="탈퇴 사유 직접 입력"
                  className="block w-full resize-none rounded-md border border-neutral-300 bg-white px-2 py-1.5 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
                <div className="flex">
                  <CharCount length={other.length} max={RESIGN_REASON_MAX_LENGTH} />
                </div>
              </div>
            )}
          </fieldset>
          <label className="block space-y-1">
            <span className="text-neutral-600 dark:text-neutral-400">
              계속하려면 <b>{CONFIRM_WORD}</b> 를 입력해 주세요.
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={loading}
              autoComplete="off"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          {error && (
            <p role="alert" className="text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
