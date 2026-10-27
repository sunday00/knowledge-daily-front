import { useState, type FormEvent } from 'react'
import type { OpinionStandardListQuery } from '@/graphql/__generated__/graphql.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useDeleteOpinion, useUpdateOpinion } from '@/actions/editOpinion.ts'
import { formatDateTime } from '@/lib/formatDate.ts'
import { isDeletedOpinion } from '@/lib/opinionStatus.ts'
import { opinionDomId } from '@/lib/scrollToOpinion.ts'
import { OPINION_TYPES, type OpinionType } from '@/lib/opinionTypes.ts'
import { OpinionTypeBadge } from '@/components/OpinionTypeBadge.tsx'
import { OpinionTypeSelect } from '@/components/OpinionTypeSelect.tsx'
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea.ts'
import { useMention } from '@/components/MentionContext.tsx'
import { CharCount } from '@/components/CharCount.tsx'
import { OPINION_MAX_LENGTH } from '@/lib/opinionLimits.ts'
import { ReportedMark } from '@/components/ReportedMark.tsx'
import { BlockableText } from '@/components/BlockableText.tsx'
import { OpinionVillainMenu, UserVillainMenu } from '@/components/OpinionVillainMenu.tsx'
import { blockedAwareContent } from '@/lib/blockedContent.ts'
import { SUBMIT_SHORTCUT_LABEL, useSubmitShortcut } from '@/hooks/useSubmitShortcut.ts'

export type OpinionListItem =
  OpinionStandardListQuery['OpinionQuery']['opinionStandardList']['items'][number]

type Mode = 'view' | 'edit' | 'confirmDelete'

const toOpinionType = (type?: string | null): OpinionType =>
  OPINION_TYPES.find((t) => t.value === type)?.value ?? ''

const textButton =
  'rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50'

export function OpinionItem({
  opinion,
  isNew = false,
}: {
  opinion: OpinionListItem
  /** 이번 화면에서 방금 단 의견이면 테두리를 살짝 강조 */
  isNew?: boolean
}) {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('view')
  const deleted = isDeletedOpinion(opinion)
  const mine = !!user && opinion.user?._id === user.userId && !deleted
  // 남의 의견이면 차단/신고 (로그인했을 때만)
  const others = !!user && !!opinion.user && opinion.user._id !== user.userId && !deleted

  return (
    <li
      id={opinionDomId(opinion._id)}
      className={`scroll-mt-4 rounded-md border p-4 ${isNew ? 'border-brand-500/50 dark:border-brand-500/60' : 'border-neutral-200 dark:border-neutral-800'}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex min-w-0 items-center font-medium text-neutral-700 dark:text-neutral-300">
          {/* 남의 의견이면 닉네임을 눌러 그 유저를 차단/신고 */}
          {others && opinion.user ? (
            <UserVillainMenu user={opinion.user} />
          ) : (
            <span className="truncate">{opinion.user?.nickname ?? '알 수 없음'}</span>
          )}
          <SidMention sid={opinion.sid} />
          <ReportedMark villainStatus={opinion.villainStatus} user={opinion.user} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <time dateTime={String(opinion.createdAt)}>{formatDateTime(opinion.createdAt)}</time>
          {mine && mode === 'view' && (
            <>
              <button type="button" className={textButton} onClick={() => setMode('edit')}>
                수정
              </button>
              <button type="button" className={textButton} onClick={() => setMode('confirmDelete')}>
                삭제
              </button>
            </>
          )}
          {others && <OpinionVillainMenu opinion={opinion} />}
        </div>
      </div>

      {deleted ? (
        <p className="mt-2 text-sm italic text-neutral-400">삭제된 의견입니다.</p>
      ) : mode === 'edit' ? (
        <EditForm opinion={opinion} onDone={() => setMode('view')} />
      ) : (
        <>
          <p className="mt-2 whitespace-pre-wrap break-words">
            <OpinionTypeBadge type={opinion.type} />
            <BlockableText text={blockedAwareContent(opinion)} />
          </p>
          {mode === 'confirmDelete' && (
            <DeleteConfirm opinionId={opinion._id} onDone={() => setMode('view')} />
          )}
        </>
      )}
    </li>
  )
}

/** '@sid'. 입력창이 있으면 눌러서 입력창에 언급을 넣을 수 있다. */
function SidMention({ sid }: { sid: number }) {
  const insertMention = useMention()?.insertMention

  if (!insertMention) {
    return <span className="ml-1 shrink-0 font-normal text-neutral-400">@{sid}</span>
  }
  return (
    <button
      type="button"
      onClick={() => insertMention(sid)}
      title="입력창에 언급 넣기"
      className="ml-1 shrink-0 rounded px-0.5 font-normal text-neutral-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-neutral-800 transition-colors"
    >
      @{sid}
    </button>
  )
}

function EditForm({ opinion, onDone }: { opinion: OpinionListItem; onDone: () => void }) {
  const [content, setContent] = useState(opinion.content)
  const [type, setType] = useState<OpinionType>(toOpinionType(opinion.type))
  const { submit, error } = useUpdateOpinion()
  const textareaRef = useAutoResizeTextarea(content, 320)

  // 화면(캐시)에 바로 반영하고 닫는다. 서버 반영 실패 시 되돌리고 상단 배너로 알림
  const save = () => {
    if (submit(opinion._id, content, type)) onDone()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    save()
  }

  // Ctrl/Cmd + Enter 저장, Esc 취소
  const shortcut = useSubmitShortcut(save, onDone)

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <div className="flex items-start gap-2">
        <OpinionTypeSelect value={type} onChange={setType} />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          {...shortcut}
          rows={2}
          aria-label="의견 수정"
          maxLength={OPINION_MAX_LENGTH}
          autoFocus
          className="min-w-0 flex-1 resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-sm text-red-600 dark:text-red-400">{error}</p>}
        <CharCount length={content.length} />
        <button type="button" className="btn text-sm" onClick={onDone}>
          취소
        </button>
        <button
          type="submit"
          title={SUBMIT_SHORTCUT_LABEL}
          disabled={!content.trim()}
          className="rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors"
        >
          저장
        </button>
      </div>
    </form>
  )
}

function DeleteConfirm({ opinionId, onDone }: { opinionId: string; onDone: () => void }) {
  const { remove } = useDeleteOpinion()

  // 화면(캐시)에 바로 삭제 상태로 반영. 서버 반영 실패 시 되돌리고 상단 배너로 알림
  const confirm = () => {
    remove(opinionId)
    onDone()
  }

  return (
    <div
      role="alertdialog"
      aria-label="의견 삭제 확인"
      className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2"
    >
      <p className="mr-auto text-sm text-red-700 dark:text-red-300">이 의견을 삭제할까요?</p>
      <button type="button" className="btn text-sm" onClick={onDone}>
        취소
      </button>
      <button
        type="button"
        onClick={confirm}
        className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 text-sm text-white transition-colors"
      >
        삭제
      </button>
    </div>
  )
}
