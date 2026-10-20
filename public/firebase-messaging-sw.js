/* global importScripts, firebase */
// src/lib/firebase.ts 에서 config 와 SDK 버전을 query string 으로 넘겨 등록한다.
const params = new URL(self.location.href).searchParams
const version = params.get('v')

importScripts(`https://www.gstatic.com/firebasejs/${version}/firebase-app-compat.js`)
importScripts(`https://www.gstatic.com/firebasejs/${version}/firebase-messaging-compat.js`)

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

// notification payload 가 있는 메시지는 FCM 이 백그라운드에서 자동 표시한다.
// data-only 메시지만 직접 표시.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? '(제목 없음)'
  // 'sv-SE' 로케일은 'YYYY-MM-DD HH:mm:ss' 형식을 준다.
  const kst = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
  console.log(`[fcm] ${title} / ${kst} KST`)
  if (payload.notification) return
  const data = payload.data ?? {}
  if (!data.title) return
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon ?? '/favicon.svg',
    image: data.image,
    data: { link: data.link },
  })
})

self.addEventListener('notificationclick', (event) => {
  const link = event.notification.data?.link
  event.notification.close()
  if (!link) return
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const target = new URL(link, self.location.origin).href
      const existing = clients.find((c) => c.url === target)
      return existing ? existing.focus() : self.clients.openWindow(target)
    }),
  )
})
