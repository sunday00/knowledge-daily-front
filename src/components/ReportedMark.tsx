import { useState } from 'react'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import { Popover } from '@/components/Popover.tsx'
import { ReportStatus } from '@/components/ReportStatus.tsx'

type Props = Pick<OpinionItemFieldsFragment, 'villainStatus' | 'user'>

/**
 * 내가 신고한 의견이나 유저면 @sid 옆에 작은 노란 사각형.
 * 누르면 바로 신고의 현재 처리 단계를 작은 창으로 보여준다. 둘 다 아니면 아무것도 안 그린다.
 */
export function ReportedMark({ villainStatus, user }: Props) {
  const [open, setOpen] = useState(false)
  const opinionReport = villainStatus?.isSuspected ? villainStatus : null
  const userReport = user?.villainStatus?.isSuspected ? user.villainStatus : null
  if (!opinionReport && !userReport) return null

  const label = `신고한 ${[opinionReport && '의견', userReport && '유저'].filter(Boolean).join(' · ')} — 눌러서 처리 상태 보기`
  return (
    <div className="ml-1 flex shrink-0 items-center">
      <Popover
        label={
          <span className="block size-2.5 rounded-[2px] border border-neutral-500 bg-amber-300/80 dark:border-0 dark:bg-amber-400/90" />
        }
        title={label}
        open={open}
        onOpenChange={setOpen}
        align="left"
        buttonClassName="flex items-center rounded p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {opinionReport && <ReportStatus target="의견" villainStatus={opinionReport} />}
          {userReport && <ReportStatus target="유저" villainStatus={userReport} />}
        </div>
      </Popover>
    </div>
  )
}
