import { ChatIcon } from '@/components/ChatIcon.tsx'
import { SayIcon } from '@/components/SayIcon.tsx'

/** opinionsCnt = [threadCnt, opinionCnt] */
export function SenseCounts({ opinionsCnt }: { opinionsCnt?: number[] | null }) {
  const [threadCnt = 0, opinionCnt = 0] = opinionsCnt ?? []

  return (
    <>
      <span title="대화수" className="inline-flex items-center gap-1">
        <ChatIcon size={16} label="대화수" />
        {threadCnt}
      </span>
      <span title="의견수" className="inline-flex items-center gap-1">
        <SayIcon size={16} label="의견수" />
        {opinionCnt}
      </span>
    </>
  )
}
