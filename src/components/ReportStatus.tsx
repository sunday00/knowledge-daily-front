import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'

type VillainStatus = NonNullable<OpinionItemFieldsFragment['villainStatus']>

// 신고 단계: 서버 status 가 DRAFT(접수) → ACTIVE(검토 중) → CLOSE(완료)
const STEPS = ['접수', '검토 중', '처리 완료'] as const

const RESULT_MESSAGE: Record<string, string> = {
  ACCEPT: '신고가 받아들여져 처리되었습니다.',
  PART: '신고 내용 중 일부가 받아들여져 처리되었습니다.',
  DENY: '검토 결과 반려되었습니다.',
  CANCELED: '신고가 취소되었습니다.',
}

function stepOf({ status, result }: Pick<VillainStatus, 'status' | 'result'>): number {
  if (status === 'CLOSE' || (result && result !== 'IDLE')) return 2
  if (status === 'ACTIVE') return 1
  return 0
}

function messageOf(step: number, result?: string | null): string {
  if (step === 2) return (result && RESULT_MESSAGE[result]) ?? '처리가 끝났습니다.'
  if (step === 1) return '관리자가 검토하고 있습니다.'
  return '접수되었습니다. 관리자가 확인하기 전입니다.'
}

/** 내가 한 신고의 현재 단계와 설명. 작은 창 안에 넣는다. */
export function ReportStatus({
  target,
  villainStatus,
}: {
  target: '의견' | '유저'
  villainStatus: Pick<VillainStatus, 'status' | 'result'>
}) {
  const step = stepOf(villainStatus)

  return (
    <div className="w-56 max-w-full space-y-1.5 p-1.5 text-sm">
      <p className="font-medium text-neutral-800 dark:text-neutral-100">{target} 신고</p>
      <ol className="flex items-center gap-1 text-xs" aria-label="신고 처리 단계">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
                →
              </span>
            )}
            <span
              aria-current={i === step ? 'step' : undefined}
              className={
                i === step
                  ? 'rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-400/20 dark:text-amber-200'
                  : i < step
                    ? 'px-1.5 py-0.5 text-neutral-500'
                    : 'px-1.5 py-0.5 text-neutral-400 dark:text-neutral-500'
              }
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-neutral-600 dark:text-neutral-300">
        {messageOf(step, villainStatus.result)}
      </p>
    </div>
  )
}
