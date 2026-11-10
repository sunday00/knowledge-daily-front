import type { ReactNode } from 'react'
import type { SenseKey } from '@/graphql/__generated__/graphql.ts'
import type { QuizSenseCardData } from '@/lib/quiz.ts'
import { SafeImage } from '@/components/SafeImage.tsx'

/** 가린 글자. 글자 수만큼의 칸으로 길이만 짐작되게 한다. */
function Masked({ text, className = '' }: { text: string; className?: string }) {
  const width = Math.min(Math.max(text.length, 2), 24)
  return (
    <span
      aria-label="가려진 내용"
      title="가려진 내용"
      className={`inline-block align-middle rounded bg-neutral-300 dark:bg-neutral-700 ${className}`}
      style={{ width: `${width}ch`, height: '1em' }}
    />
  )
}

/**
 * 퀴즈 문항에 놓이는 상식 카드. 반응·댓글·내 상식 추가 없이 내용만 보여 준다.
 * hide 에 든 필드는 가린다. (WHOLE 이면 카드 전체)
 */
export function QuizSenseCard({
  sense,
  hide,
  action,
}: {
  sense: QuizSenseCardData
  hide: readonly SenseKey[]
  /** 오른쪽 위에 둘 버튼 (예: 빼기) */
  action?: ReactNode
}) {
  const hidden = new Set(hide)

  if (hidden.has('WHOLE')) {
    return (
      <div className="flex min-h-24 items-center justify-between gap-3 rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-4">
        <span className="mx-auto text-2xl font-bold text-neutral-400" aria-label="가려진 상식">
          ?
        </span>
        {action}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h4 className="truncate text-base font-semibold">
            {hidden.has('title') ? <Masked text={sense.title} /> : sense.title}
          </h4>
          {sense.nativeLang && (
            <span className="truncate text-sm text-neutral-500 dark:text-neutral-400">
              {hidden.has('nativeLang') ? <Masked text={sense.nativeLang} /> : sense.nativeLang}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
          <span>Lv.{hidden.has('lv') ? '?' : sense.lv}</span>
          {action}
        </div>
      </div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {hidden.has('description') ? <Masked text={sense.description} /> : sense.description}
      </p>
      <SenseImages sense={sense} hidden={hidden.has('attaches')} />
      {sense.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {sense.tags.map((t) => (
            <li
              key={t._id}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              #{hidden.has('tags') ? '???' : t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 상식 사진을 작게 나란히. 누르면 원본을 새 탭으로. 가리면 같은 크기의 빈 칸 */
function SenseImages({ sense, hidden }: { sense: QuizSenseCardData; hidden: boolean }) {
  const images = sense.images ?? []
  if (images.length === 0) return null

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {images.map((img) => (
        <li key={img.id}>
          {hidden ? (
            <span
              aria-label="가려진 사진"
              title="가려진 사진"
              className="flex h-20 w-20 items-center justify-center rounded-md bg-neutral-300 text-neutral-500 dark:bg-neutral-700"
            >
              ?
            </span>
          ) : (
            <a href={img.full} target="_blank" rel="noreferrer" className="block">
              <SafeImage
                src={img.thumb}
                alt={img.alt}
                loading="lazy"
                className="h-20 w-20 rounded-md object-cover bg-neutral-100 dark:bg-neutral-800"
              />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
