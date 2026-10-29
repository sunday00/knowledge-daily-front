import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { boardPath, findBoardBySlug, type BoardConfig } from '@/lib/boards.ts'
import { useCreateAsk } from '@/actions/createAsk.ts'
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea.ts'
import { SUBMIT_SHORTCUT_LABEL, useSubmitShortcut } from '@/hooks/useSubmitShortcut.ts'

export default function BoardWritePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const board = findBoardBySlug(slug)
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!board) return <p className="text-neutral-500">게시판을 찾을 수 없습니다.</p>

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{board.label || board.title} · 새 글 작성</h2>
      {board.children === 'Ask' ? (
        <AskForm board={board} />
      ) : (
        <p className="text-neutral-500">이 게시판은 아직 글쓰기를 지원하지 않습니다.</p>
      )}
    </section>
  )
}

/** 문의/요청(ask) 글쓰기: 분류 + 내용 */
function AskForm({ board }: { board: BoardConfig }) {
  const navigate = useNavigate()
  const categories = board.categories ?? []
  // ?category=add 처럼 들어오면 그 분류를 미리 골라 둔다 (게시판에 있는 분류일 때만)
  const preset = useSearchParams()[0].get('category')
  const [category, setCategory] = useState(
    categories.some((c) => c.code === preset) ? (preset as string) : '',
  )
  const [quest, setQuest] = useState('')
  const { submit, saving, error } = useCreateAsk()
  const textareaRef = useAutoResizeTextarea(quest, 480)

  const send = async () => {
    if (saving) return
    const id = await submit({ board: board._id, category, quest })
    if (id) navigate(boardPath(board), { replace: true, state: { created: true } })
  }
  const shortcut = useSubmitShortcut(() => void send())

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 분류는 몇 개뿐이라 드롭다운 대신 칩으로 고른다. 실제로는 라디오라 방향키로도 이동한다. */}
      <fieldset className="space-y-2" disabled={saving}>
        <legend className="text-sm text-neutral-700 dark:text-neutral-300">분류</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.code} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c.code}
                checked={category === c.code}
                onChange={() => setCategory(c.code)}
                required
                className="peer sr-only"
              />
              <span className="inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-colors border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-indigo-300 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white dark:peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/50 peer-disabled:opacity-60">
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className="block text-sm text-neutral-700 dark:text-neutral-300">내용</span>
        <textarea
          ref={textareaRef}
          value={quest}
          onChange={(e) => setQuest(e.target.value)}
          disabled={saving}
          required
          rows={6}
          placeholder="요청하거나 문의할 내용을 적어 주세요."
          className="w-full min-h-36 resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:border-brand-500"
          {...shortcut}
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-xs text-neutral-400">{SUBMIT_SHORTCUT_LABEL} 로 등록</span>
        <Link to={boardPath(board)} className="btn no-underline">
          취소
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn bg-brand-600 border-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {saving ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  )
}
