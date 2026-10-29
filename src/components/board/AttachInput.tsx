import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { useUploadAttach, type UploadedAttach } from '@/actions/uploadAttach.ts'
import { SafeImage } from '@/components/SafeImage.tsx'

export const ATTACH_MAX_COUNT = 10
const ATTACH_MAX_BYTES = 20 * 1024 * 1024 // 20MB

/** 폼의 첨부 한 장. 고르면 바로 업로드하고, 끝나면 id 가 생긴다. */
export type AttachDraft = {
  key: string
  name: string
  /** 미리보기 이미지 주소 (로컬 blob 또는 저장된 썸네일) */
  preview: string
  status: 'uploading' | 'done' | 'error'
  id?: string
  /** 올라간 주소들 ({ [크기 이름]: url }). 본문의 이미지 마크다운을 찾을 때 쓴다. */
  src?: Record<string, string>
  error?: string
}

/** 저장된 첨부(attach.src = { [크기 이름]: url })를 폼 첨부로 */
export function attachDraftOf(a: {
  attach: { _id: string; originalName: string; src?: unknown }
}): AttachDraft {
  const src = (a.attach.src ?? {}) as Record<string, string>
  return {
    key: a.attach._id,
    id: a.attach._id,
    name: a.attach.originalName,
    preview: src.thumbnail ?? src.full ?? Object.values(src)[0] ?? '',
    status: 'done',
    src,
  }
}

/** 글에 보낼 attaches (올라간 것만, 화면 순서대로) */
export const attachesInputOf = (items: AttachDraft[]) =>
  items.flatMap((a, i) => (a.status === 'done' && a.id ? [{ attach: a.id, sortKey: i }] : []))

let seq = 0

/**
 * 이미지 첨부 입력. 파일을 고르면 바로 webp 로 바꿔 올리고, 썸네일과 진행 상태를 보여준다.
 * 목록 상태는 폼이 가지고 있다. (등록할 때 attachesInputOf 로 보냄)
 */
export function AttachInput({
  items,
  setItems,
  disabled,
  onUploaded,
  onRemoved,
  onPick,
}: {
  items: AttachDraft[]
  setItems: Dispatch<SetStateAction<AttachDraft[]>>
  disabled?: boolean
  /** 한 장이 올라가면 호출 (본문에 이미지 마크다운 넣기 등) */
  onUploaded?: (uploaded: UploadedAttach) => void
  /** 첨부를 뺐을 때 호출 (본문의 이미지 마크다운 지우기 등) */
  onRemoved?: (removed: AttachDraft) => void
  /** 올라간 사진을 눌렀을 때 호출 (본문에 다시 넣기 등) */
  onPick?: (picked: AttachDraft) => void
}) {
  const upload = useUploadAttach()
  const inputRef = useRef<HTMLInputElement>(null)
  // 화면을 떠나면 로컬 미리보기 주소를 정리한다.
  const itemsRef = useRef(items)
  itemsRef.current = items
  useEffect(
    () => () =>
      itemsRef.current.forEach(
        (a) => a.preview.startsWith('blob:') && URL.revokeObjectURL(a.preview),
      ),
    [],
  )

  const patch = (key: string, next: Partial<AttachDraft>) =>
    setItems((prev) => prev.map((a) => (a.key === key ? { ...a, ...next } : a)))

  const addFiles = (files: File[]) => {
    const room = ATTACH_MAX_COUNT - items.length
    files.slice(0, Math.max(0, room)).forEach((file, i) => {
      const key = `new-${++seq}`
      const draft: AttachDraft = {
        key,
        name: file.name,
        preview: URL.createObjectURL(file),
        status: 'uploading',
      }
      if (!file.type.startsWith('image/')) {
        Object.assign(draft, { status: 'error', error: '이미지 파일만 올릴 수 있습니다.' })
      } else if (file.size > ATTACH_MAX_BYTES) {
        Object.assign(draft, { status: 'error', error: '20MB 이하만 올릴 수 있습니다.' })
      }
      setItems((prev) => [...prev, draft])
      if (draft.status === 'error') return
      upload(file, items.length + i)
        .then((res) => {
          patch(key, { status: 'done', id: res.id, src: res.src })
          onUploaded?.(res)
        })
        .catch((e: unknown) =>
          patch(key, { status: 'error', error: e instanceof Error ? e.message : String(e) }),
        )
    })
  }

  const remove = (target: AttachDraft) => {
    if (target.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview)
    setItems((prev) => prev.filter((a) => a.key !== target.key))
    onRemoved?.(target)
  }

  const full = items.length >= ATTACH_MAX_COUNT

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm text-neutral-700 dark:text-neutral-300">
        <span>
          이미지 첨부{' '}
          <span className="text-xs text-neutral-400">(선택, 최대 {ATTACH_MAX_COUNT}장)</span>
        </span>
        <span className="text-xs tabular-nums text-neutral-400">
          {items.length}/{ATTACH_MAX_COUNT}
        </span>
      </div>

      <ul className="flex flex-wrap gap-2">
        {items.map((a) => (
          <li
            key={a.key}
            title={a.error ?? a.name}
            className={`relative h-24 w-24 overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-800 ${
              a.status === 'error'
                ? 'border-red-400 dark:border-red-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {a.preview &&
              (onPick && a.status === 'done' && a.src ? (
                // 다 올라간 사진은 눌러서 본문 커서 위치에 다시 넣을 수 있다.
                <button
                  type="button"
                  onClick={() => onPick(a)}
                  disabled={disabled}
                  aria-label={`${a.name} 본문에 넣기`}
                  title="눌러서 본문에 넣기"
                  className="group block h-full w-full"
                >
                  <SafeImage
                    src={a.preview}
                    alt={a.name}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                  />
                </button>
              ) : (
                <SafeImage
                  src={a.preview}
                  alt={a.name}
                  className={`h-full w-full object-cover ${a.status === 'done' ? '' : 'opacity-40'}`}
                />
              ))}
            {a.status === 'uploading' && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-700 dark:text-neutral-200">
                올리는 중...
              </span>
            )}
            {a.status === 'error' && (
              <span className="absolute inset-x-0 bottom-0 bg-red-600/90 px-1 py-0.5 text-[10px] leading-tight text-white line-clamp-2">
                {a.error}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(a)}
              disabled={disabled}
              aria-label={`${a.name} 첨부 빼기`}
              title="첨부 빼기"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
            >
              ✕
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 text-sm text-neutral-500 transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-indigo-300 disabled:opacity-60"
            >
              <span aria-hidden className="text-xl">
                ＋
              </span>
              사진 추가
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []))
          e.target.value = '' // 같은 파일을 다시 골라도 change 가 오도록
        }}
      />
    </div>
  )
}
