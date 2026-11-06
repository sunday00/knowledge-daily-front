import { useRef, useState, type FormEvent } from 'react'
import { useApolloClient } from '@apollo/client'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { formatDateTime } from '@/lib/formatDate.ts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import {
  aliasesOf,
  attachSrcOf,
  attachThumbOf,
  systemFlagsOf,
  useMyAttaches,
  type MyAttach,
} from '@/hooks/useMyAttaches.ts'
import { useDeRelateMyAttach, useUpdateAttachAliases } from '@/actions/myAttach.ts'
import { useUploadAttach } from '@/actions/uploadAttach.ts'
import { ATTACH_MY_LIST_QUERY } from '@/graphql/queries/attach.ts'
import { ATTACH_MAX_BYTES } from '@/components/board/AttachInput.tsx'
import { SearchInput, useSearchKeyword } from '@/components/attach/MyAttachPicker.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { Modal, ModalButton, ModalSpinner } from '@/components/Modal.tsx'

const ALIAS_MAX_LENGTH = 30
/** 이미지 하나에 붙일 수 있는 별칭 수 (프론트에서만 막는다) */
const ALIAS_MAX_COUNT = 3

/** /user/media — 내 미디어 관리: 내 이미지 목록, 별칭 붙이기, 버리기 */
export default function MyMediaPage() {
  const { user } = useAuth()
  const { draft, setDraft, keyword } = useSearchKeyword()

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">내 미디어 관리</h2>
          <UploadButton />
        </div>
        <p className="text-sm text-neutral-500">
          내가 올린 이미지입니다. 별칭을 붙여 두면 글을 쓸 때 &lsquo;기존 사진&rsquo;에서 쉽게 찾을
          수 있어요.
        </p>
      </div>
      <SearchInput value={draft} onChange={setDraft} />
      {/* 검색어마다 목록을 새로 그려 스크롤 감지·커서가 섞이지 않게 한다 */}
      <MediaList key={keyword} keyword={keyword} />
    </section>
  )
}

type UploadState = { total: number; done: number; failed: string[] } | null

/** 이미지 추가. 여러 장을 골라 하나씩 올리고, 끝나면 내 이미지 목록을 다시 받는다 */
function UploadButton() {
  const upload = useUploadAttach()
  const client = useApolloClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>(null)
  const busy = !!state && state.done < state.total

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return
    setState({ total: files.length, done: 0, failed: [] })
    for (const [i, file] of files.entries()) {
      let error: string | null = null
      if (!file.type.startsWith('image/')) error = '이미지 파일이 아닙니다'
      else if (file.size > ATTACH_MAX_BYTES) error = '20MB 를 넘습니다'
      else {
        try {
          await upload(file, i)
        } catch (e) {
          error = e instanceof Error ? e.message : String(e)
        }
      }
      setState(
        (s) =>
          s && {
            ...s,
            done: s.done + 1,
            failed: error ? [...s.failed, `${file.name}: ${error}`] : s.failed,
          },
      )
    }
    await client.refetchQueries({ include: [ATTACH_MY_LIST_QUERY] })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? `올리는 중… (${state.done}/${state.total})` : '＋ 이미지 추가'}
      </button>
      {state && !busy && (
        <p role="status" className="text-right text-xs">
          {state.failed.length === 0 ? (
            <span className="text-green-700 dark:text-green-400">
              {state.total}장을 올렸습니다.
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400">
              {state.total - state.failed.length}장 올림, {state.failed.length}장 실패
              {state.failed.map((f) => (
                <span key={f} className="block">
                  {f}
                </span>
              ))}
            </span>
          )}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []))
          e.target.value = '' // 같은 파일을 다시 골라도 change 가 오도록
        }}
      />
    </div>
  )
}

function MediaList({ keyword }: { keyword: string }) {
  const { res, loading, loadingMore, error, loadMore } = useMyAttaches(keyword)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)
  const [discarding, setDiscarding] = useState<MyAttach | null>(null)
  const items = res?.items ?? []

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-600 dark:text-red-400">조회 실패: {error.message}</p>
  if (res && !res.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {res.message ?? '서버가 실패를 반환했습니다.'}
      </p>
    )
  }
  if (items.length === 0) {
    return (
      <p className="text-neutral-500">
        {keyword ? '찾는 이미지가 없습니다.' : '아직 올린 이미지가 없습니다.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {res?.total != null && (
        <p className="text-sm text-neutral-500">{res.total.toLocaleString()}개</p>
      )}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <MediaCard key={a._id} attach={a} onDiscard={() => setDiscarding(a)} />
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <LoadingSpinner size="sm" />}
      <DiscardModal attach={discarding} onClose={() => setDiscarding(null)} />
    </div>
  )
}

function MediaCard({ attach, onDiscard }: { attach: MyAttach; onDiscard: () => void }) {
  const [viewing, setViewing] = useState(false)
  const alt = aliasesOf(attach.flags)[0] ?? attach.originalName
  return (
    <li className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setViewing(true)}
        title="크게 보기"
        aria-label={`${alt} 크게 보기`}
        className="group block aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-900"
      >
        <SafeImage
          src={attachThumbOf(attach)}
          alt={alt}
          className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
        />
      </button>
      <ImageViewerModal
        open={viewing}
        onClose={() => setViewing(false)}
        attach={attach}
        alt={alt}
      />
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={attach.originalName}>
            {attach.originalName}
          </p>
          <time dateTime={String(attach.createdAt)} className="text-xs text-neutral-500">
            {formatDateTime(attach.createdAt)}
          </time>
        </div>
        <AliasEditor attach={attach} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            title="준비 중입니다"
            className="btn text-xs disabled:opacity-50"
          >
            사용처 보기 (준비 중)
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="btn text-xs text-red-600 dark:text-red-400"
          >
            버리기
          </button>
        </div>
      </div>
    </li>
  )
}

/** 원본(full) 크게 보기. 새 탭으로 보기를 누르면 이미지 주소를 새 탭으로 연다 */
function ImageViewerModal({
  open,
  onClose,
  attach,
  alt,
}: {
  open: boolean
  onClose: () => void
  attach: MyAttach
  alt: string
}) {
  const src = attachSrcOf(attach).full ?? attachThumbOf(attach)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<span className="block truncate">{alt}</span>}
      icon={null}
      wide
      footer={
        <>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-24 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100 no-underline transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            새 탭으로 보기
          </a>
          <ModalButton variant="primary" onClick={onClose} autoFocus>
            닫기
          </ModalButton>
        </>
      }
    >
      {/* 열릴 때만 원본을 받는다 */}
      {open && (
        <SafeImage
          src={src}
          alt={alt}
          className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain"
        />
      )}
    </Modal>
  )
}

/** 별칭 칩 + 추가 입력. 바꿀 때마다 최종 목록으로 저장한다 (기록용 flag 는 그대로 함께 보낸다) */
function AliasEditor({ attach }: { attach: MyAttach }) {
  const { update, loading } = useUpdateAttachAliases()
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const aliases = aliasesOf(attach.flags)
  const full = aliases.length >= ALIAS_MAX_COUNT

  const save = async (next: string[]) => {
    setErr(null)
    try {
      await update(attach._id, [...next, ...systemFlagsOf(attach.flags)])
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const alias = text.trim()
    if (!alias || loading || full) return
    if (aliases.includes(alias)) {
      setText('')
      return
    }
    if (await save([...aliases, alias])) setText('')
  }

  return (
    <div className="space-y-2">
      {aliases.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="별칭">
          {aliases.map((alias) => (
            <li
              key={alias}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
            >
              {alias}
              <button
                type="button"
                disabled={loading}
                onClick={() => void save(aliases.filter((x) => x !== alias))}
                aria-label={`별칭 ${alias} 지우기`}
                className="leading-none opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        // 카드 높이를 맞추려고 칩 한 줄 높이로 자리를 둔다
        <p className="py-0.5 text-xs leading-normal text-neutral-400 dark:text-neutral-600">
          아직 별칭 없음
        </p>
      )}
      {full ? (
        <p className="text-xs text-neutral-500">
          별칭은 {ALIAS_MAX_COUNT}개까지 붙일 수 있어요. 바꾸려면 하나를 지운 뒤 추가하세요.
        </p>
      ) : (
        <form onSubmit={add} className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={ALIAS_MAX_LENGTH}
            placeholder={`별칭 추가 (${aliases.length}/${ALIAS_MAX_COUNT})`}
            aria-label={`${attach.originalName} 별칭 추가`}
            className="min-w-0 flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
          />
          <button type="submit" className="btn shrink-0 text-xs" disabled={!text.trim() || loading}>
            추가
          </button>
        </form>
      )}
      {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
    </div>
  )
}

/** 버리기 확인. 되돌릴 수 없고, 이미 쓴 글의 이미지는 그대로이며 내 이미지 목록·검색에서만 사라진다고 알린다 */
function DiscardModal({ attach, onClose }: { attach: MyAttach | null; onClose: () => void }) {
  const { deRelate, loading } = useDeRelateMyAttach()
  const [err, setErr] = useState<string | null>(null)

  const close = () => {
    if (loading) return
    setErr(null)
    onClose()
  }

  const confirm = async () => {
    if (!attach) return
    setErr(null)
    try {
      await deRelate(attach._id)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Modal
      open={!!attach}
      onClose={close}
      tone="warning"
      icon={loading ? <ModalSpinner /> : undefined}
      dismissible={!loading}
      title="이 이미지를 버릴까요?"
      footer={
        <>
          <ModalButton onClick={close} disabled={loading}>
            취소
          </ModalButton>
          <ModalButton variant="danger" onClick={() => void confirm()} disabled={loading} autoFocus>
            {loading ? '버리는 중…' : '버리기'}
          </ModalButton>
        </>
      }
    >
      {attach && (
        <div className="space-y-3">
          <SafeImage
            src={attachThumbOf(attach)}
            alt={attach.originalName}
            className="mx-auto h-24 w-24 rounded-md object-cover"
          />
          <ul className="space-y-1 text-left">
            <li>
              • <strong>되돌릴 수 없습니다.</strong> 버린 이미지는 다시 내 이미지로 가져올 수
              없어요.
            </li>
            <li>
              • 이미 쓴 글·본문의 이미지는 <strong>지워지지 않고</strong> 그대로 보입니다.
            </li>
            <li>• 내 미디어 목록과 &lsquo;기존 사진&rsquo; 검색에서만 사라집니다.</li>
          </ul>
          {err && <p className="text-red-600 dark:text-red-400">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
