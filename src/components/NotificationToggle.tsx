import { useEffect, useState } from 'react'
import { diagnoseFcm, isFcmAvailable } from '@/lib/firebase.ts'
import { reportError } from '@/lib/errorReporter.ts'
import { useSyncFcmToken } from '@/hooks/useFcmTokenSync.ts'

type State = 'checking' | 'unsupported' | NotificationPermission

export function NotificationToggle() {
  const syncFcmToken = useSyncFcmToken()
  const [state, setState] = useState<State>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    isFcmAvailable().then((ok) => {
      if (!cancelled) setState(ok ? Notification.permission : 'unsupported')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const enable = async () => {
    setError(null)
    setBusy(true)
    try {
      // Safari/Firefox 는 사용자 클릭 직후가 아니면 권한 창을 띄우지 않으므로 다른 await 보다 먼저 호출.
      const permission = await Notification.requestPermission()
      setState(permission)
      if (permission === 'granted') await syncFcmToken()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // 환경 감지 결과와 무관하게 권한 요청 + 토큰 등록을 시도한다. 실패하면 이유를 상단 ErrorBanner 로 보고.
  const forceEnable = async () => {
    setError(null)
    setBusy(true)
    try {
      if ('Notification' in window) setState(await Notification.requestPermission())
      if (await syncFcmToken()) {
        setState('granted')
        return
      }
      reportError('[FCM] 알림 강제 켜기 실패', { reasons: await diagnoseFcm() })
    } catch (e: unknown) {
      reportError('[FCM] 알림 강제 켜기 실패', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-4 py-3">
      <div className="space-y-0.5">
        <div className="font-medium">알림</div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{describe(state)}</p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {state === 'default' && (
          <button type="button" className="btn" onClick={enable} disabled={busy}>
            {busy ? '켜는 중...' : '알림 켜기'}
          </button>
        )}
        <button type="button" className="btn text-sm" onClick={forceEnable} disabled={busy}>
          강제로 켜기
        </button>
      </div>
    </div>
  )
}

function describe(state: State): string {
  switch (state) {
    case 'checking':
      return '확인 중...'
    case 'unsupported':
      return '이 브라우저에서는 알림을 받을 수 없습니다. (iPhone 은 홈 화면에 추가한 뒤 사용할 수 있어요)'
    case 'granted':
      return '이 기기에서 알림을 받고 있습니다.'
    case 'denied':
      return '알림이 차단되어 있습니다. 브라우저 주소창의 사이트 설정에서 알림을 허용해 주세요.'
    case 'default':
      return '이 기기에서 새 소식을 알림으로 받아보세요.'
  }
}
