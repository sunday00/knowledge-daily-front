import {
  siBlogger,
  siDiscord,
  siFacebook,
  siGithub,
  siInstagram,
  siKakaotalk,
  siLine,
  siMedium,
  siNaver,
  siPinterest,
  siSpotify,
  siTelegram,
  siThreads,
  siTiktok,
  siTistory,
  siTwitch,
  siVelog,
  siWhatsapp,
  siWordpress,
  siX,
  siYoutube,
} from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'

// hostname (lowercased, www. 제외) → simple-icons 아이콘 매칭 규칙.
// 각 host 는 정확히 일치하거나 서브도메인으로 그 host 아래에 있으면 매칭됨.
const RULES: ReadonlyArray<readonly [string, SimpleIcon]> = [
  ['instagram.com', siInstagram],
  ['x.com', siX],
  ['twitter.com', siX],
  ['facebook.com', siFacebook],
  ['fb.com', siFacebook],
  ['youtube.com', siYoutube],
  ['youtu.be', siYoutube],
  ['tiktok.com', siTiktok],
  ['threads.net', siThreads],
  ['threads.com', siThreads],
  ['github.com', siGithub],
  ['discord.com', siDiscord],
  ['discord.gg', siDiscord],
  ['medium.com', siMedium],
  ['naver.com', siNaver], // blog.naver.com, cafe.naver.com 등 커버
  ['tistory.com', siTistory],
  ['velog.io', siVelog],
  ['kakao.com', siKakaotalk],
  ['line.me', siLine],
  ['telegram.org', siTelegram],
  ['t.me', siTelegram],
  ['whatsapp.com', siWhatsapp],
  ['wa.me', siWhatsapp],
  ['pinterest.com', siPinterest],
  ['spotify.com', siSpotify],
  ['twitch.tv', siTwitch],
  ['blogger.com', siBlogger],
  ['blogspot.com', siBlogger],
  ['wordpress.com', siWordpress],
]

function hostOf(href: string): string | null {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

export function findBrandIcon(href: string): SimpleIcon | null {
  const host = hostOf(href)
  if (!host) return null
  for (const [pattern, icon] of RULES) {
    if (host === pattern || host.endsWith(`.${pattern}`)) return icon
  }
  return null
}
