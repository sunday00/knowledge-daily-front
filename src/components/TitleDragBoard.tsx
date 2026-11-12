import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AchievementIcon } from '@/components/AchievementIcon.tsx'
import { AppliedTitleRow } from '@/components/AppliedTitleRow.tsx'
import type { AchievementTitleOption } from '@/hooks/useMyAchievements.ts'

type Zone = 'applied' | 'pool'
type Target = { zone: 'applied'; index: number; blocked: boolean } | { zone: 'pool' }
type Drag = {
  name: string
  from: Zone
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  /** 조금이라도 끌었는지 (안 끌고 떼면 그냥 누른 것) */
  moved: boolean
  target: Target | null
}

// 이만큼 움직여야 끄는 것으로 본다 (누르기와 구분)
const DRAG_THRESHOLD = 6

type Props = {
  /** 적용한 칭호 id, 우선순위 순 */
  applied: string[]
  achievedById: Map<string, AchievementTitleOption>
  limit: number
  /** 적용 칭호가 바뀌면(넣기 / 빼기 / 순서) 새 id 배열로 부른다 */
  onChange: (names: string[]) => void
  disabled?: boolean
}

const contains = (el: HTMLElement | null, x: number, y: number) => {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

/**
 * 칭호 고르기. 위 = 적용한 칭호(순위), 아래 = 획득했지만 적용 안 한 칭호.
 * 아래에서 위로 끌어 놓으면 놓은 자리 순위로 적용, 위에서 아래로 끌어 놓으면 해제, 위에서 끌면 순서 변경.
 * 마우스 / 터치 모두 pointer 이벤트. 키보드: 아래 칩은 Enter 로 맨 뒤에 적용, 위 손잡이는 ↑ / ↓ 로 순서, Delete 로 해제.
 */
export function TitleDragBoard({ applied, achievedById, limit, onChange, disabled }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const appliedBox = useRef<HTMLDivElement>(null)
  const poolBox = useRef<HTMLDivElement>(null)
  const rows = useRef(new Map<string, HTMLLIElement>())
  // 끌고 난 뒤 따라오는 click 은 무시한다
  const justDragged = useRef(false)

  const active = drag?.moved ? drag : null
  const full = applied.length >= limit
  // 끄는 동안 위 목록: 끄는 칭호를 빼고, 놓일 자리에 빈칸
  const base = active?.from === 'applied' ? applied.filter((n) => n !== active.name) : applied
  const slot = active?.target?.zone === 'applied' ? active.target : null
  const pool = [...achievedById.values()].filter((o) => !applied.includes(o.id))

  const targetOf = (d: Drag, x: number, y: number): Target | null => {
    if (contains(appliedBox.current, x, y)) {
      const others = d.from === 'applied' ? applied.filter((n) => n !== d.name) : applied
      let index = 0
      for (const n of others) {
        const r = rows.current.get(n)?.getBoundingClientRect()
        if (r && y > r.top + r.height / 2) index++
      }
      return { zone: 'applied', index, blocked: d.from === 'pool' && full }
    }
    if (contains(poolBox.current, x, y)) return { zone: 'pool' }
    return null
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>, name: string, from: Zone) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    setDrag({
      name,
      from,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      target: null,
    })
  }

  // 끄는 동안 움직임 / 놓기는 window 에서 받는다. (위에서 끄는 줄은 목록에서 빠져 요소가 사라지므로)
  const latest = useRef({ drag, targetOf, applied, onChange })
  latest.current = { drag, targetOf, applied, onChange }
  const dragging = drag !== null
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: globalThis.PointerEvent) => {
      const { drag: d, targetOf: find } = latest.current
      if (!d || e.pointerId !== d.pointerId) return
      const moved =
        d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD
      if (!moved) return
      e.preventDefault()
      setDrag({ ...d, moved, x: e.clientX, y: e.clientY, target: find(d, e.clientX, e.clientY) })
    }
    const onUp = (e: globalThis.PointerEvent) => {
      const { drag: d, applied: cur, onChange: change } = latest.current
      if (!d || e.pointerId !== d.pointerId) return
      setDrag(null)
      if (!d.moved) return
      justDragged.current = true
      // 끌기 뒤 click 이 안 오는 경우(다른 곳에서 뗌)를 위해 곧 풀어 준다
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
      const t = d.target
      if (!t) return
      if (t.zone === 'pool') {
        if (d.from === 'applied') change(cur.filter((n) => n !== d.name))
        return
      }
      if (t.blocked) return
      const next = cur.filter((n) => n !== d.name)
      next.splice(t.index, 0, d.name)
      if (next.join('\n') !== cur.join('\n')) change(next)
    }
    const onCancel = () => setDrag(null)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [dragging])

  const dragProps = (name: string, from: Zone) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => onPointerDown(e, name, from),
    // 터치로 끌 때 화면이 스크롤되지 않게
    style: { touchAction: 'none' as const },
  })

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onChange(applied.filter((_, i) => i !== index))
      return
    }
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
    if (to === null) return
    e.preventDefault()
    if (to < 0 || to >= applied.length) return
    const next = [...applied]
    const [picked] = next.splice(index, 1)
    next.splice(to, 0, picked)
    onChange(next)
  }

  const addToEnd = (name: string) => {
    // 끌고 놓은 뒤 따라오는 click 은 무시
    if (justDragged.current) return
    if (disabled || full) return
    onChange([...applied, name])
  }

  const ghost = active ? achievedById.get(active.name) : undefined
  const overApplied = active?.target?.zone === 'applied'
  const overPool = active?.target?.zone === 'pool' && active.from === 'applied'

  // 위 목록에 그릴 줄: 칭호 + 놓일 자리 빈칸
  const appliedRows: ({ kind: 'item'; name: string } | { kind: 'slot' })[] = base.map((name) => ({
    kind: 'item',
    name,
  }))
  if (slot) appliedRows.splice(slot.index, 0, { kind: 'slot' })

  return (
    // 끄는 동안 글자가 선택되지 않게
    <div className="select-none space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold">적용한 칭호</h3>
          <p className="text-xs tabular-nums text-neutral-500">
            {applied.length} / {limit}
          </p>
        </div>
        <div
          ref={appliedBox}
          className={`min-h-[4.5rem] rounded-xl border-2 border-dashed p-2 transition-colors ${
            overApplied && slot?.blocked
              ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30'
              : overApplied
                ? 'border-amber-400 bg-amber-50/60 dark:border-amber-600 dark:bg-amber-950/30'
                : 'border-neutral-200 dark:border-neutral-800'
          }`}
        >
          {appliedRows.length === 0 ? (
            <p className="flex h-14 items-center justify-center text-sm text-neutral-400">
              아래 칭호를 여기로 끌어 놓으면 적용돼요
            </p>
          ) : (
            <ol aria-label="적용한 칭호 (우선순위 순)" className="space-y-1.5">
              {appliedRows.map((row, i) =>
                row.kind === 'slot' ? (
                  <li
                    key="__slot"
                    aria-hidden
                    className={`flex h-11 items-center justify-center rounded-lg border-2 border-dashed text-xs ${
                      slot?.blocked
                        ? 'border-red-300 text-red-500 dark:border-red-800'
                        : 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {slot?.blocked ? `칭호는 ${limit}개까지예요` : `${i + 1}순위로 놓기`}
                  </li>
                ) : (
                  <li
                    key={row.name}
                    ref={(el) => {
                      if (el) rows.current.set(row.name, el)
                      else rows.current.delete(row.name)
                    }}
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <button
                      type="button"
                      aria-label={`${i + 1}순위. 끌어서 순서 바꾸기, 아래로 끌어 놓으면 해제. 키보드: 위/아래 화살표, Delete`}
                      disabled={disabled}
                      {...dragProps(row.name, 'applied')}
                      onKeyDown={(e) => onHandleKey(e, applied.indexOf(row.name))}
                      className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                        aria-hidden
                      >
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" />
                        <circle cx="15" cy="18" r="1.5" />
                      </svg>
                    </button>
                    <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-neutral-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <AppliedTitleRow name={row.name} option={achievedById.get(row.name)} />
                    </div>
                  </li>
                ),
              )}
            </ol>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">획득한 칭호</h3>
        <div
          ref={poolBox}
          className={`min-h-[4.5rem] rounded-xl border-2 border-dashed p-2 transition-colors ${
            overPool
              ? 'border-brand-400 bg-brand-50/60 dark:border-indigo-600 dark:bg-indigo-950/30'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}
        >
          {pool.length === 0 && !overPool ? (
            <p className="flex h-14 items-center justify-center text-sm text-neutral-400">
              {applied.length > 0 ? '획득한 칭호를 모두 적용했어요' : '획득한 칭호가 없어요'}
            </p>
          ) : (
            <ul aria-label="획득한 칭호" className="flex flex-wrap gap-2">
              {pool.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    title={
                      full
                        ? `칭호는 ${limit}개까지 적용할 수 있습니다.`
                        : '끌어서 위에 놓거나 눌러서 적용'
                    }
                    {...dragProps(o.id, 'pool')}
                    onClick={() => addToEnd(o.id)}
                    className={`flex cursor-grab items-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-sm text-neutral-700 transition-opacity hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900 ${
                      active?.name === o.id ? 'opacity-30' : ''
                    }`}
                  >
                    <AchievementIcon itemKey={o.itemKey} status="achieved" size={24} />
                    {o.title}
                  </button>
                </li>
              ))}
              {overPool && (
                <li
                  aria-hidden
                  className="flex items-center rounded-full border-2 border-dashed border-brand-300 px-3 py-1 text-xs text-brand-600 dark:border-indigo-700 dark:text-indigo-300"
                >
                  여기 놓으면 해제
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {active && ghost && (
        // 끄는 칭호를 포인터 옆에 띄운다
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-amber-300 bg-white py-1 pl-1 pr-3 text-sm font-medium text-amber-800 shadow-lg dark:border-amber-700 dark:bg-neutral-900 dark:text-amber-200"
          style={{ left: active.x, top: active.y }}
        >
          <AchievementIcon itemKey={ghost.itemKey} status="achieved" applied size={24} />
          {ghost.title}
        </div>
      )}
    </div>
  )
}
