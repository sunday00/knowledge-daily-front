import type { AchievementStatus } from '@/lib/achievement.ts'

type Props = {
  /** 업적 항목 키 (opinionCreate 등). 모르는 키는 트로피 */
  itemKey: string
  status: AchievementStatus
  /** 달성 중일 때 테두리에 그릴 진행률 (0~1) */
  ratio?: number
  /** 칭호로 적용 중인지 (달성한 것만) */
  applied?: boolean
  size?: number
}

// 상태가 한눈에 보이게: 칭호 적용 = 주황, 달성 = 브랜드색(달성 중보다 조금 밝게), 달성 중 = 브랜드색 + 진행 테두리, 잠김 = 회색
const TONE: Record<AchievementStatus | 'applied', string> = {
  applied:
    'bg-amber-100 text-amber-600 ring-2 ring-amber-400 shadow-md shadow-amber-200/60 dark:bg-amber-900/50 dark:text-amber-300 dark:ring-amber-500 dark:shadow-none',
  achieved:
    'bg-brand-50 text-brand-500 ring-2 ring-brand-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-700',
  inProgress: 'bg-brand-100 text-brand-700 dark:bg-indigo-900/60 dark:text-indigo-200',
  locked:
    'bg-neutral-100 text-neutral-300 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-600 dark:ring-neutral-800',
}

/** 항목별 그림 (24 기준 좌표, 가운데 정렬) */
function Glyph({ itemKey }: { itemKey: string }) {
  switch (itemKey) {
    case 'opinionCreate':
      // 말풍선
      return (
        <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      )
    case 'reactionCreate':
      // 웃는 얼굴
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <path d="M9 9.5h.01M15 9.5h.01" />
        </>
      )
    case 'goodReceive':
      // 엄지 (Lucide thumbs-up, ISC)
      return (
        <>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </>
      )
    case 'earnPoints':
      // 동전
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6.5v1.5M12 16v1.5" />
        </>
      )
    default:
      // 트로피
      return (
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9 20l1-3h4l1 3" />
      )
  }
}

/** 업적 메달. 상태에 따라 색과 테두리가 달라진다 */
export function AchievementIcon({ itemKey, status, ratio = 0, applied, size = 48 }: Props) {
  const tone = status === 'achieved' && applied ? 'applied' : status
  const r = size / 2 - 2
  const length = 2 * Math.PI * r
  const clamped = Math.min(Math.max(ratio, 0), 1)
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${TONE[tone]}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {status === 'inProgress' && (
        // 진행 테두리: 바탕 원 + 진행만큼 칠한 원 (12시 방향부터)
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} fill="none">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth="3"
            className="stroke-brand-300 dark:stroke-indigo-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - clamped)}
            className="stroke-brand-600 dark:stroke-indigo-300 transition-[stroke-dashoffset] duration-500"
          />
        </svg>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size * 0.5}
        height={size * 0.5}
        fill={status === 'achieved' ? 'currentColor' : 'none'}
        fillOpacity={status === 'achieved' ? 0.25 : undefined}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph itemKey={itemKey} />
      </svg>
      {status === 'achieved' && (
        // 달성 표시: 오른쪽 아래 체크
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-2 ${
            tone === 'applied' ? 'bg-amber-500' : 'bg-brand-400 dark:bg-indigo-500'
          } ring-white dark:ring-neutral-950`}
        >
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
      )}
      {status === 'locked' && (
        // 잠김 표시: 오른쪽 아래 자물쇠
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300 text-white ring-2 ring-white dark:bg-neutral-700 dark:ring-neutral-950">
          <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor">
            <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z" />
          </svg>
        </span>
      )}
    </span>
  )
}
