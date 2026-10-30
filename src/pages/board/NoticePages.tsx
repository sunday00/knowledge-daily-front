import { useParams } from 'react-router-dom'
import { NOTICE_TITLE } from '@/lib/notice.ts'
import { NoticeList } from '@/components/notice/NoticeList.tsx'
import {
  hasNoticeComponent,
  NoticeOneView,
  noticeTarget,
} from '@/components/notice/NoticeOneView.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { ThreadConversation } from '@/components/ThreadConversation.tsx'

/** /board/notice — 공지 목록 */
export function NoticePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{NOTICE_TITLE}</h2>
      <NoticeList />
    </section>
  )
}

/** /board/notice/:id — 공지 + (opinion 이면) 대화록 */
export function NoticeDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <NoticeOneView id={id}>
      {(item) =>
        hasNoticeComponent(item, 'Opinion') && <TargetThreads target={noticeTarget(item)} />
      }
    </NoticeOneView>
  )
}

/** /board/notice/:id/threads/:threadId — 공지 + 한 대화(thread)의 의견 목록 */
export function NoticeThreadPage() {
  const { id = '', threadId = '' } = useParams<{ id: string; threadId: string }>()

  return (
    <NoticeOneView id={id}>
      {(item) =>
        hasNoticeComponent(item, 'Opinion') && (
          <ThreadConversation target={noticeTarget(item)} threadId={threadId} />
        )
      }
    </NoticeOneView>
  )
}
