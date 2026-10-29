import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { boardPath, type BoardConfig } from '@/lib/boards.ts'
import { ARTICLE_TITLE_MAX, useSaveArticle } from '@/actions/article.ts'
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea.ts'
import { SUBMIT_SHORTCUT_LABEL, useSubmitShortcut } from '@/hooks/useSubmitShortcut.ts'
import { CategoryChips } from '@/components/board/CategoryChips.tsx'
import {
  AttachInput,
  attachDraftOf,
  attachesInputOf,
  type AttachDraft,
} from '@/components/board/AttachInput.tsx'
import { extractHashtags } from '@/lib/hashtags.ts'
import { imageMarkdown, removeImageMarkdown } from '@/lib/imageMarkdown.ts'
import { CharCount } from '@/components/CharCount.tsx'

type Editing = {
  _id: string
  title: string
  content: string
  category?: string | null
  attaches: { sortKey: number; attach: { _id: string; originalName: string; src?: unknown } }[]
}

const inputClass =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500'

/**
 * 게시글 작성/수정 폼: 분류(게시판에 있으면) + 제목 + 내용(마크다운) + 이미지 첨부.
 * 태그는 따로 고르지 않고 본문의 #태그를 모아 보낸다. (수정하면 그 목록으로 교체)
 * article 을 주면 수정, 없으면 새 글.
 */
export function ArticleForm({ board, article }: { board: BoardConfig; article?: Editing }) {
  const navigate = useNavigate()
  const categories = board.categories ?? []
  const needCategory = categories.length > 0
  const [category, setCategory] = useState(article?.category ?? '')
  const [title, setTitle] = useState(article?.title ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [attaches, setAttaches] = useState<AttachDraft[]>(() =>
    [...(article?.attaches ?? [])].sort((a, b) => a.sortKey - b.sortKey).map(attachDraftOf),
  )
  const uploading = attaches.some((a) => a.status === 'uploading')
  const hashtags = extractHashtags(content)
  const { submitCreate, submitUpdate, saving, error } = useSaveArticle()
  const textareaRef = useAutoResizeTextarea(content, 640)

  // 본문에서 마지막으로 있던 커서 위치. 한 번도 안 건드렸으면 null (→ 본문 맨 뒤)
  const caretRef = useRef<number | null>(null)
  const contentRef = useRef(content)
  contentRef.current = content
  const rememberCaret = () => {
    const el = textareaRef.current
    if (el) caretRef.current = el.selectionEnd
  }

  /** 이미지 마크다운을 마지막 커서 위치(없으면 맨 뒤)에 한 줄로 넣는다. (사진이 올라갈 때, 첨부 사진을 누를 때) */
  const insertImage = (image: { name: string; src?: Record<string, string> }) => {
    if (!image.src) return
    const md = imageMarkdown({ name: image.name, src: image.src })
    if (!md) return
    // 업로드가 연달아 끝나도 직전에 넣은 결과 위에 이어 넣도록 최신 본문을 ref 로 본다.
    // (setState 업데이터 안에서 ref 를 고치면 StrictMode 에서 두 번 실행돼 어긋난다)
    const prev = contentRef.current
    const at = Math.min(caretRef.current ?? prev.length, prev.length)
    const before = prev.slice(0, at)
    const after = prev.slice(at)
    const head = before && !before.endsWith('\n') ? '\n' : ''
    const tail = after.startsWith('\n') ? '' : '\n'
    const inserted = head + md + tail
    const next = before + inserted + after
    // 여러 장이면 올라온 순서대로 아래에 붙도록 커서를 넣은 글 뒤로 옮긴다.
    caretRef.current = at + inserted.length
    contentRef.current = next
    setContent(next)
  }
  /** 첨부를 빼면 본문에 넣었던 그 이미지 줄도 지운다. (사용자가 고친 줄도 주소가 같으면 지움) */
  const removeImage = (removed: AttachDraft) => {
    const urls = Object.values(removed.src ?? {}).filter(Boolean)
    if (urls.length === 0) return
    const prev = contentRef.current
    const next = removeImageMarkdown(prev, urls)
    if (next === prev) return
    // 지운 만큼 커서가 본문 밖으로 나가지 않게 맞춘다.
    if (caretRef.current != null) caretRef.current = Math.min(caretRef.current, next.length)
    contentRef.current = next
    setContent(next)
  }
  const detailPath = (id: string) => `${boardPath(board)}/${id}`

  const send = async () => {
    if (saving || uploading) return
    const draft = { category, title, content, attaches: attachesInputOf(attaches) }
    if (article) {
      if (await submitUpdate(article._id, draft, needCategory)) {
        navigate(detailPath(article._id), { replace: true, state: { updated: true } })
      }
      return
    }
    const id = await submitCreate(board._id, draft, needCategory)
    if (id) navigate(detailPath(id), { replace: true, state: { created: true } })
  }
  const shortcut = useSubmitShortcut(() => void send())

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {needCategory && (
        <CategoryChips
          categories={categories}
          value={category}
          onChange={setCategory}
          disabled={saving}
          required
        />
      )}

      <label className="block space-y-1">
        <span className="flex items-baseline justify-between text-sm text-neutral-700 dark:text-neutral-300">
          제목
          <CharCount length={title.length} max={ARTICLE_TITLE_MAX} />
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          required
          maxLength={ARTICLE_TITLE_MAX}
          placeholder="제목을 입력하세요."
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">
          내용 <span className="text-xs text-neutral-400">(마크다운 사용 가능)</span>
        </span>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            rememberCaret()
          }}
          onSelect={rememberCaret}
          onBlur={rememberCaret}
          disabled={saving}
          required
          rows={10}
          placeholder="자유롭게 적어 주세요. #태그 처럼 쓰면 태그로 붙어요."
          className={`${inputClass} min-h-56 resize-none`}
          {...shortcut}
        />
      </label>

      {/* 본문에서 찾은 태그 미리보기. 등록/저장하면 이 목록으로 태그가 붙는다. (수정 시 교체) */}
      {hashtags.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-neutral-500">태그</span>
          {hashtags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-xs bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200"
            >
              #{t}
            </span>
          ))}
        </p>
      )}

      <AttachInput
        items={attaches}
        setItems={setAttaches}
        disabled={saving}
        onUploaded={insertImage}
        onRemoved={removeImage}
        onPick={insertImage}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-xs text-neutral-400">
          {SUBMIT_SHORTCUT_LABEL} 로 {article ? '저장' : '등록'}
        </span>
        <Link
          to={article ? detailPath(article._id) : boardPath(board)}
          className="btn no-underline"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={saving || uploading}
          title={uploading ? '이미지를 올리는 중입니다.' : undefined}
          className="btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {saving ? '저장 중...' : uploading ? '올리는 중...' : article ? '저장' : '등록'}
        </button>
      </div>
    </form>
  )
}
