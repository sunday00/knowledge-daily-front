import { initializeApp, SDK_VERSION, type FirebaseOptions } from 'firebase/app'
import { reportError } from './errorReporter'
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging'

// firebase 기본 scope 와 동일. 추후 앱 자체 SW 가 생겨도 '/' scope 와 충돌하지 않게 분리.
const SW_SCOPE = '/firebase-cloud-messaging-push-scope'

type FcmContext = {
  messaging: Messaging
  registration: ServiceWorkerRegistration
  vapidKey: string
}

function readConfig(): { options: FirebaseOptions; vapidKey: string } | null {
  const env = import.meta.env
  const options = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
  const vapidKey = env.VITE_FIREBASE_VAPID_KEY
  if (Object.values(options).some((v) => !v) || !vapidKey) {
    console.warn('[fcm] Firebase env missing. VITE_FIREBASE_* 를 .env.local 에 설정하세요.')
    return null
  }
  return { options, vapidKey }
}

async function setup(): Promise<FcmContext | null> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null
  if (!(await isSupported())) return null

  const config = readConfig()
  if (!config) return null

  // SW 는 import.meta.env 를 읽을 수 없으므로 config 를 query string 으로 전달.
  // SDK 버전도 함께 넘겨 SW 의 CDN 스크립트 버전을 패키지 버전과 맞춘다.
  const params = new URLSearchParams({
    ...(config.options as Record<string, string>),
    v: SDK_VERSION,
  })
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    { scope: SW_SCOPE },
  )

  const messaging = getMessaging(initializeApp(config.options))

  // 포그라운드에서는 FCM 이 알림을 자동 표시하지 않으므로 직접 띄운다.
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? payload.data?.title
    console.log(`[fcm] ${title ?? '(제목 없음)'} / ${nowKst()}`)
    if (!title) return
    const options: NotificationOptions & { image?: string } = {
      body: payload.notification?.body ?? payload.data?.body,
      icon: payload.notification?.icon ?? '/favicon.svg',
      image: payload.notification?.image ?? payload.data?.image,
      data: { link: payload.fcmOptions?.link ?? payload.data?.link },
    }
    void registration.showNotification(title, options)
  })

  return { messaging, registration, vapidKey: config.vapidKey }
}

// 'sv-SE' 로케일은 'YYYY-MM-DD HH:mm:ss' 형식을 준다.
function nowKst(): string {
  return `${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`
}

let contextPromise: Promise<FcmContext | null> | null = null

function getContext(): Promise<FcmContext | null> {
  // 실패(null)는 캐시하지 않아 권한 허용 / 강제 켜기 후 다시 시도할 수 있게 한다.
  contextPromise ??= setup()
    .catch((e: unknown) => {
      reportError('[FCM] 알림 초기화 실패', e)
      return null
    })
    .then((ctx) => {
      if (!ctx) contextPromise = null
      return ctx
    })
  return contextPromise
}

/** 이 브라우저에서 FCM 을 쓸 수 있는지 (미지원 브라우저 / env 미설정이면 false). */
export async function isFcmAvailable(): Promise<boolean> {
  return (await getContext()) !== null
}

/** FCM 을 쓸 수 없는 이유 목록. 비어 있으면 환경상 문제 없음. */
export async function diagnoseFcm(): Promise<string[]> {
  const reasons: string[] = []
  if (!window.isSecureContext) {
    reasons.push(`보안 컨텍스트 아님 (https 또는 localhost 필요): ${window.location.origin}`)
  }
  if (!('serviceWorker' in navigator)) reasons.push('serviceWorker 미지원')
  if (!('Notification' in window)) {
    reasons.push('Notification API 미지원 (iPhone 은 홈 화면에 추가 후 실행 필요)')
  } else if (Notification.permission !== 'granted') {
    reasons.push(`알림 권한: ${Notification.permission}`)
  }
  if (!(await isSupported().catch(() => false))) reasons.push('firebase messaging 미지원 브라우저')
  if (!readConfig()) reasons.push('VITE_FIREBASE_* env 미설정')
  return reasons
}

/**
 * 알림 권한이 허용된 상태라면 이 클라이언트의 FCM 토큰을 반환한다.
 * 권한 요청은 하지 않는다 — 사용자 클릭에서 Notification.requestPermission() 을 직접 호출할 것.
 * 미지원 브라우저 / 권한 미허용 / env 미설정이면 null.
 */
export async function prepareFcmToken(): Promise<string | null> {
  const ctx = await getContext()
  if (!ctx) return null
  if (Notification.permission !== 'granted') return null

  return getToken(ctx.messaging, {
    vapidKey: ctx.vapidKey,
    serviceWorkerRegistration: ctx.registration,
  })
}
