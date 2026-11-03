import { useEffect, useState } from 'react'

/** 클립보드 복사. 클립보드 API 를 못 쓰는 환경(http 등)이면 임시 textarea 로 복사한다. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      ta.remove()
    }
  }
}

/** 누르면 text 를 복사하고 잠깐 "복사됨" 으로 바뀐다. */
export function CopyButton({ text, label = '복사' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), 1500)
    return () => window.clearTimeout(timer)
  }, [state])

  return (
    <button
      type="button"
      onClick={() => void copyText(text).then((ok) => setState(ok ? 'done' : 'fail'))}
      className="btn shrink-0 text-sm"
    >
      <span aria-live="polite">
        {state === 'done' ? '복사됨 ✓' : state === 'fail' ? '복사 실패' : label}
      </span>
    </button>
  )
}
