import { Link } from 'react-router-dom'
import { useIsPaidUser } from '@/lib/paidUser.ts'
import { useMyEmbed } from '@/actions/embedApply.ts'
import { formatDateTime } from '@/lib/formatDate.ts'

export const EMBED_APPLY_PATH = '/user/settings/embed'

/** 개인설정 > 유료서비스 탭: 신청할 수 있는 유료서비스 목록 */
export function PaidServices() {
  const paid = useIsPaidUser()
  if (!paid) {
    return <p className="text-neutral-500">유료 회원이 되면 이용할 수 있습니다.</p>
  }
  return <PaidServiceList />
}

function PaidServiceList() {
  const { embed } = useMyEmbed()
  const expired = embed ? Date.parse(embed.expiredAt as string) < Date.now() : false

  return (
    <ul className="space-y-2">
      <li>
        <Link
          to={EMBED_APPLY_PATH}
          className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3 no-underline text-inherit hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              🖼️ 임베드 이미지 상식
            </p>
            <p className="text-sm text-neutral-500">
              블로그 등에 붙이면 내가 최근 받은 상식을 이미지로 보여줍니다.
            </p>
            {embed && (
              <p
                className={`text-xs ${expired ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
              >
                {expired ? '기한 지남' : `이용 중 · ${formatDateTime(embed.expiredAt)}까지`}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm text-brand-600 dark:text-indigo-300">
            {embed ? '관리 →' : '신청 →'}
          </span>
        </Link>
      </li>
    </ul>
  )
}
