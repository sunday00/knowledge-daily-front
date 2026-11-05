import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SafeImage } from '@/components/SafeImage.tsx'

const AUTOPLAY_MS = 5000
const SWIPE_PX = 40
// 이미지 크기 정보가 없을 때의 배너 비율 (가로:세로)
const DEFAULT_RATIO = '3 / 1'

type SlideAttach = { src: unknown; elements: { name: string; size: number[] }[] }

/** 캐러셀 한 장. 배너(Banner)와 캠페인(Campaign)을 이 모양으로 바꿔 함께 넣는다. */
export type CarouselSlide = {
  /** 종류가 달라도 겹치지 않게 'banner:' 처럼 앞에 붙인 값 */
  key: string
  title: string
  subTitle?: string | null
  /** 이미지 위에 제목/부제를 얹을지. 이미지가 없으면 항상 글자로 보인다. */
  showTitle: boolean
  /** 누르면 갈 주소. 사이트 안 주소는 라우터로, 바깥 주소는 새 탭으로 */
  href?: string
  /** 대표 이미지 */
  attach?: SlideAttach | null
  /** 이미지가 없을 때의 배경 (CSS background). 없으면 브랜드색 */
  background?: string
  sortKey: number
}

/** 첨부 중 sortKey 가 가장 앞인 것 */
export const firstAttach = <T extends { sortKey: number; attach: SlideAttach }>(attaches: T[]) =>
  [...attaches].sort((a, z) => a.sortKey - z.sortKey)[0]?.attach

type Props = {
  banners: CarouselSlide[]
  /** 스크린리더용 이름 */
  label: string
  className?: string
}

/** 좌우로 넘어가는 배너. 자동으로 넘기고, 마우스를 올리거나 포커스가 있으면 멈춘다. */
export function BannerCarousel({ banners, label, className = '' }: Props) {
  const count = banners.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = count ? index % count : 0
  const go = (to: number) => setIndex(((to % count) + count) % count)

  const reducedMotion = usePrefersReducedMotion()
  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [count, current, paused, reducedMotion])

  // 터치로 밀어 넘기기. 민 직후의 클릭(배너 이동)은 막는다.
  const touchX = useRef<number | null>(null)
  const swiped = useRef(false)
  const onClickCapture = (e: MouseEvent) => {
    if (!swiped.current) return
    swiped.current = false
    e.preventDefault()
  }

  if (count === 0) return null
  const ratio = imageRatio(banners[0]) ?? DEFAULT_RATIO

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={`group relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 ${className}`}
      style={{ aspectRatio: ratio }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
        swiped.current = false
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (count < 2 || Math.abs(dx) < SWIPE_PX) return
        swiped.current = true
        go(current + (dx < 0 ? 1 : -1))
      }}
      onClickCapture={onClickCapture}
    >
      <ul
        className="flex h-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((b, i) => (
          <li
            key={b.key}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={i !== current}
            className="h-full w-full shrink-0"
          >
            <BannerLink href={b.href} title={b.title} focusable={i === current}>
              {b.attach ? (
                <BannerImage slide={b} eager={i === 0} />
              ) : (
                // 이미지가 없으면 색 배경에 제목을 크게
                <span
                  className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700"
                  style={b.background ? { background: b.background } : undefined}
                />
              )}
              {(b.showTitle || !b.attach) && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-8 pt-12 text-white sm:px-10 sm:pb-12 sm:pt-16">
                  <span className="block text-2xl font-bold leading-tight sm:text-4xl">
                    {b.title}
                  </span>
                  {b.subTitle && (
                    <span className="mt-1 block text-base opacity-90 sm:text-xl">{b.subTitle}</span>
                  )}
                </span>
              )}
            </BannerLink>
          </li>
        ))}
      </ul>

      {count > 1 && (
        <>
          <ArrowButton side="left" label="이전 배너" onClick={() => go(current - 1)} />
          <ArrowButton side="right" label="다음 배너" onClick={() => go(current + 1)} />
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.key}
                type="button"
                aria-label={`${i + 1}번째 배너 보기`}
                aria-current={i === current || undefined}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/** href 로 이동. 사이트 안 주소는 라우터로, 바깥 주소는 새 탭으로 연다. */
function BannerLink({
  href,
  title,
  focusable,
  children,
}: {
  href?: string
  title: string
  focusable: boolean
  children: ReactNode
}) {
  const className = 'relative block h-full w-full no-underline'
  const tabIndex = focusable ? undefined : -1
  if (!href) return <div className={className}>{children}</div>
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link to={href} aria-label={title} tabIndex={tabIndex} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      tabIndex={tabIndex}
      className={className}
    >
      {children}
    </a>
  )
}

function BannerImage({ slide, eager }: { slide: CarouselSlide; eager: boolean }) {
  const attach = slide.attach
  const src = (attach?.src ?? {}) as Record<string, string>
  // 크기 이름별 가로폭으로 srcSet 을 만들어 화면 폭에 맞는 이미지를 받게 한다.
  const srcSet = attach?.elements
    .filter((el) => src[el.name] && el.size[0])
    .map((el) => `${src[el.name]} ${el.size[0]}w`)
    .join(', ')

  return (
    <SafeImage
      src={src.full ?? src.preview ?? Object.values(src)[0]}
      srcSet={srcSet || undefined}
      sizes="(min-width: 1024px) 976px, 100vw"
      alt={slide.title}
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      className="h-full w-full object-cover"
    />
  )
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right'
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 ${side === 'left' ? 'left-2' : 'right-2'} flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white opacity-0 transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover:opacity-100`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}

/** 대표 이미지의 원본(full) 비율. 없으면 null */
function imageRatio(b: CarouselSlide): string | null {
  const els = b.attach?.elements ?? []
  const [w, h] = (els.find((el) => el.name === 'full') ?? els[0])?.size ?? []
  return w && h ? `${w} / ${h}` : null
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}
