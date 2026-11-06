import { useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue.ts'
import { Modal, ModalButton } from '@/components/Modal.tsx'
import { SafeImage } from '@/components/SafeImage.tsx'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll.ts'
import { aliasesOf, attachThumbOf, useMyAttaches, type MyAttach } from '@/hooks/useMyAttaches.ts'

/**
 * 기존 사진에서 고르기. 내 이미지를 최신순으로 보여 주고, 검색(별칭 / 파일 이름)과 아래로 내려 이어 받기.
 * 하나 고르면 onPick 을 부르고 검색을 비운 뒤 닫는다.
 */
export function MyAttachPickerModal({
  open,
  onClose,
  onPick,
  pickedIds,
}: {
  open: boolean
  onClose: () => void
  onPick: (attach: MyAttach) => void
  /** 이미 글에 붙은 사진 (표시만, 다시 골라도 본문에 넣는다) */
  pickedIds?: ReadonlySet<string>
}) {
  const { draft, setDraft, keyword } = useSearchKeyword()

  const close = () => {
    setDraft('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="기존 사진에서 추가"
      icon={null}
      wide
      footer={<ModalButton onClick={close}>닫기</ModalButton>}
    >
      <div className="space-y-3">
        <SearchInput value={draft} onChange={setDraft} />
        {/* 열려 있을 때만 받는다. 검색어마다 목록을 새로 그려 스크롤 감지·커서가 섞이지 않게 */}
        {open && (
          <PickerGrid
            key={keyword}
            keyword={keyword}
            pickedIds={pickedIds}
            onPick={(a) => {
              onPick(a)
              close()
            }}
          />
        )}
      </div>
    </Modal>
  )
}

/** 입력 중인 검색어를 잠깐(300ms) 멈췄을 때의 값으로. 비우면 바로 비운다 */
export function useSearchKeyword() {
  const [draft, setDraft] = useState('')
  const trimmed = draft.trim()
  const debounced = useDebouncedValue(trimmed, 300)
  return { draft, setDraft, keyword: trimmed ? debounced : '' }
}

/** 실시간 검색 입력. 입력을 멈추면 검색한다 (검색 버튼 없음) */
export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="search">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // 엔터로 바깥 폼(글쓰기)이 제출되지 않게
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        placeholder="별칭이나 파일 이름으로 검색"
        aria-label="내 이미지 검색"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      />
    </div>
  )
}

function PickerGrid({
  keyword,
  pickedIds,
  onPick,
}: {
  keyword: string
  pickedIds?: ReadonlySet<string>
  onPick: (attach: MyAttach) => void
}) {
  const { res, loading, loadingMore, error, loadMore } = useMyAttaches(keyword)
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(loadMore, !!res?.hasNext && !loadingMore)
  const items = res?.items ?? []

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800 p-2">
      {loading && <LoadingSpinner />}
      {error && <p className="p-2 text-red-600 dark:text-red-400">조회 실패: {error.message}</p>}
      {res && !res.success && (
        <p className="p-2 text-red-600 dark:text-red-400">
          {res.message ?? '서버가 실패를 반환했습니다.'}
        </p>
      )}
      {res?.success && items.length === 0 && (
        <p className="p-4 text-center text-neutral-500">
          {keyword ? '찾는 이미지가 없습니다.' : '아직 올린 이미지가 없습니다.'}
        </p>
      )}
      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {items.map((a) => {
            const aliases = aliasesOf(a.flags)
            const label = aliases[0] ?? a.originalName
            const picked = pickedIds?.has(a._id)
            return (
              <li key={a._id}>
                <button
                  type="button"
                  onClick={() => onPick(a)}
                  title={`${[...aliases, a.originalName].join(' · ')}${picked ? ' (이미 첨부됨)' : ''}`}
                  aria-label={`${label} 본문에 넣기`}
                  className={`group relative block aspect-square w-full overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-800 ${
                    picked
                      ? 'border-brand-500 ring-2 ring-brand-500/40'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-brand-500'
                  }`}
                >
                  <SafeImage
                    src={attachThumbOf(a)}
                    alt={label}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[11px] text-white">
                    {label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div ref={sentinelRef} aria-hidden />
      {loadingMore && <LoadingSpinner size="sm" />}
    </div>
  )
}
