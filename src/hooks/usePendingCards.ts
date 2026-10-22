import { useRef, useState } from 'react'

/** 화면에만 끼워 둔 카드. at = 캐시 목록에서 몇 번째 항목 앞에 보일지 (붙일 당시의 목록 길이) */
export type Placed<P> = P & { key: string; at: number }

export type Row<T, P> = { kind: 'item'; item: T } | { kind: 'pending'; pending: Placed<P> }

/**
 * 아직 받지 않은 페이지가 있어 캐시 목록에 넣을 수 없는 새 카드를,
 * 붙일 당시 보고 있던 목록 끝 위치(at)에 화면으로만 끼워 둔다.
 * 이후 페이지가 붙어도 그 자리(새 카드 → 다음 페이지 순)를 유지한다.
 */
export function usePendingCards<P>() {
  const [pending, setPending] = useState<Placed<P>[]>([])

  const add = (card: P, key: string, at: number) =>
    setPending((list) => [...list, { ...card, key, at }])

  /** 제자리(실제 페이지)에 받아진 카드는 뺀다 */
  const drop = (keys: Set<string>) => setPending((list) => list.filter((p) => !keys.has(p.key)))

  const clear = () => setPending([])

  /** 캐시 목록 사이에 임시 카드를 끼워 화면에 그릴 순서로 만든다 */
  const rowsOf = <T>(items: T[]): Row<T, P>[] => {
    const rows: Row<T, P>[] = []
    let pi = 0
    items.forEach((item, i) => {
      while (pi < pending.length && pending[pi].at <= i) {
        rows.push({ kind: 'pending', pending: pending[pi++] })
      }
      rows.push({ kind: 'item', item })
    })
    while (pi < pending.length) rows.push({ kind: 'pending', pending: pending[pi++] })
    return rows
  }

  return { pending, add, drop, clear, rowsOf }
}

/**
 * 같은 커서로 동시에 두 번 요청하지 않게 한다.
 * (새 카드를 붙이며 다음 페이지를 받는 중에 무한스크롤이 같은 페이지를 또 부르는 경우)
 */
export function useOncePerCursor<R>(fetch: (after: string) => Promise<R>) {
  const inflight = useRef<{ after: string; promise: Promise<R> } | null>(null)

  return (after: string): Promise<R> => {
    if (inflight.current?.after === after) return inflight.current.promise
    const promise = fetch(after).finally(() => {
      if (inflight.current?.promise === promise) inflight.current = null
    })
    inflight.current = { after, promise }
    return promise
  }
}
