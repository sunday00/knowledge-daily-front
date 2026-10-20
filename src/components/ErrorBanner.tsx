import { useSyncExternalStore } from 'react'
import { dismissError, getErrors, subscribeErrors } from '@/lib/errorReporter.ts'

/** 평소엔 숨겨져 있다가 에러가 보고되면 화면 상단에 띄운다. X 로 하나씩 닫는다. */
export function ErrorBanner() {
  const errors = useSyncExternalStore(subscribeErrors, getErrors)
  if (errors.length === 0) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 max-h-[70vh] overflow-y-auto space-y-2 px-4 pb-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
    >
      {errors.map((e) => (
        <div
          key={e.id}
          className="mx-auto max-w-5xl rounded-md border border-red-300 bg-red-50 text-red-900 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          <div className="flex items-start gap-3 px-4 py-2">
            <p className="flex-1 font-medium break-all">{e.message}</p>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => dismissError(e.id)}
              className="shrink-0 rounded px-2 text-lg leading-none hover:bg-red-100 dark:hover:bg-red-900"
            >
              ×
            </button>
          </div>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all border-t border-red-200 px-4 py-2 text-xs dark:border-red-900">
            {e.log}
          </pre>
        </div>
      ))}
    </div>
  )
}
