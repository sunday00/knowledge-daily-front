import { LightbulbIcon } from './LightbulbIcon'

// 다른 사이트/블로그로 마크업이 그대로 복사돼도 외부 링크로 동작하도록
// react-router의 <Link> 가 아니라 네이티브 <a href> 를 사용한다.
export function SiteTitle() {
  const href = import.meta.env.VITE_SITE_URL ?? '/'
  return (
    <h1 className="text-3xl font-bold">
      <a
        href={href}
        aria-label="Knowledge Daily 홈"
        className="inline-flex items-center gap-3 no-underline text-inherit hover:opacity-80 transition-opacity"
      >
        <LightbulbIcon size={40} />
        Knowledge Daily
      </a>
    </h1>
  )
}