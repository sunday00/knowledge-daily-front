import { useState } from 'react'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import { useToggleBlock, type BlockTarget } from '@/actions/villain.ts'
import { Popover } from '@/components/Popover.tsx'
import { ReportStatus } from '@/components/ReportStatus.tsx'
import { ReportForm } from '@/components/OpinionVillainMenu.tsx'

// 의견과 같은 차단 / 신고 상태 (isBlocked, isSuspected, status, result)
type VillainStatus = NonNullable<OpinionItemFieldsFragment['villainStatus']>
type VillainFlags = VillainStatus | null | undefined

const menuItem =
  'block w-full whitespace-nowrap rounded px-2 py-1.5 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'

/**
 * 남의 게시글 / 퀴즈 상세의 [차단] [신고] 버튼. 의견의 메뉴(OpinionVillainMenu)와 같은 모양.
 * - 차단: 그 콘텐츠 / 작성자 (이미 했으면 해제)
 * - 신고: 사유를 골라 접수. 처리 전이면 '신고됨' 이고, 누르면 지금 처리 단계를 보여준다.
 */
export function ContentVillainMenu({
  target,
  noun,
  villainStatus,
  user,
}: {
  target: BlockTarget
  /** 메뉴 문구의 대상 ('게시글', '퀴즈') */
  noun: string
  villainStatus?: VillainFlags
  user?: { _id: string; villainStatus?: Pick<VillainStatus, 'isBlocked'> | null } | null
}) {
  const [open, setOpen] = useState<'block' | 'report' | 'status' | null>(null)
  const { toggle } = useToggleBlock()
  const contentBlocked = !!villainStatus?.isBlocked
  const userBlocked = !!user?.villainStatus?.isBlocked
  const reported = !!villainStatus?.isSuspected
  const close = () => setOpen(null)

  return (
    // 창이 열린 동안엔 아래 버튼들보다 위로
    <div className={`relative flex items-center gap-1 ${open ? 'z-30' : 'z-1'}`}>
      <Popover
        label={contentBlocked || userBlocked ? '차단됨' : '차단'}
        title="차단 / 차단 해제"
        open={open === 'block'}
        onOpenChange={(v) => setOpen(v ? 'block' : null)}
        buttonClassName="btn px-2 py-1 text-xs"
      >
        <button
          type="button"
          className={menuItem}
          onClick={() => {
            toggle(target, !contentBlocked)
            close()
          }}
        >
          {contentBlocked ? `${noun} 차단 해제` : `${noun} 차단`}
        </button>
        {user && (
          <button
            type="button"
            className={menuItem}
            onClick={() => {
              toggle({ entity: 'User', id: user._id }, !userBlocked)
              close()
            }}
          >
            {userBlocked ? '유저 차단 해제' : '유저 차단'}
          </button>
        )}
      </Popover>

      {reported && villainStatus ? (
        <Popover
          label="신고됨"
          title="신고 처리 상태"
          open={open === 'status'}
          onOpenChange={(v) => setOpen(v ? 'status' : null)}
          buttonClassName="btn px-2 py-1 text-xs"
        >
          <ReportStatus target={noun} villainStatus={villainStatus} />
        </Popover>
      ) : (
        <Popover
          label="신고"
          title={`${noun} 신고`}
          open={open === 'report'}
          onOpenChange={(v) => setOpen(v ? 'report' : null)}
          buttonClassName="btn px-2 py-1 text-xs"
        >
          <ReportForm target={target} onDone={close} />
        </Popover>
      )}
    </div>
  )
}
