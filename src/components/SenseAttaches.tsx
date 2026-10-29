import { SafeImage } from '@/components/SafeImage.tsx'
// 상식, 게시글 공용 (sortKey + attach { _id originalName src })
type AttachItem = { sortKey: number; attach: { _id: string; originalName: string; src?: unknown } }

/** attach.src = { [elementName]: url }. full 을 우선 쓰고, 없으면 첫 번째 url. */
function fullSrcOf(src: unknown): string | null {
  if (!src || typeof src !== 'object') return null
  const map = src as Record<string, unknown>
  const url = map.full ?? Object.values(map)[0]
  return typeof url === 'string' && url ? url : null
}

/** 1장이면 크게, 여러 장이면 2열 격자로 보여준다. 누르면 원본을 새 탭으로 연다. */
export function SenseAttaches({ attaches }: { attaches: AttachItem[] }) {
  const images = [...attaches]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((a) => ({ id: a.attach._id, alt: a.attach.originalName, src: fullSrcOf(a.attach.src) }))
    .filter((img): img is { id: string; alt: string; src: string } => img.src !== null)

  if (images.length === 0) return null
  const single = images.length === 1

  return (
    <ul className={single ? '' : 'grid grid-cols-2 gap-2'}>
      {images.map((img) => (
        <li key={img.id}>
          <a href={img.src} target="_blank" rel="noreferrer" className="block">
            <SafeImage
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className={
                single
                  ? 'w-full max-h-[28rem] object-contain rounded-md bg-neutral-100 dark:bg-neutral-800'
                  : 'w-full aspect-square object-cover rounded-md bg-neutral-100 dark:bg-neutral-800'
              }
            />
          </a>
        </li>
      ))}
    </ul>
  )
}
