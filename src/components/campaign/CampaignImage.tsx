import { SafeImage } from '@/components/SafeImage.tsx'

type Attach = { src: unknown; elements: { name: string; size: number[] }[] }

/**
 * 캠페인 첨부 이미지 한 장. 크기 이름별 가로폭으로 srcSet 을 만들어 화면 폭에 맞는 이미지를 받는다.
 * 원본 비율을 미리 잡아 두어 이미지가 늦게 와도 화면이 출렁이지 않게 한다.
 */
export function CampaignImage({
  attach,
  alt,
  sizes = '(min-width: 1024px) 976px, 100vw',
  eager,
  className = '',
}: {
  attach: Attach
  alt: string
  sizes?: string
  eager?: boolean
  className?: string
}) {
  const src = (attach.src ?? {}) as Record<string, string>
  const els = attach.elements
  const [w, h] = (els.find((el) => el.name === 'full') ?? els[0])?.size ?? []
  const srcSet = els
    .filter((el) => src[el.name] && el.size[0])
    .map((el) => `${src[el.name]} ${el.size[0]}w`)
    .join(', ')
  return (
    <SafeImage
      src={src.full ?? src.preview ?? Object.values(src)[0]}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      className={`block w-full ${className}`}
      style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}
    />
  )
}
