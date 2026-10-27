import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'
import { isDeletedOpinion } from '@/lib/opinionStatus.ts'
import { blockedAwareContent, maskBlocked } from '@/lib/blockedContent.ts'
import { OpinionTypeBadge } from '@/components/OpinionTypeBadge.tsx'

/**
 * 의견 미리보기 내용: 닉네임 @sid + 본문(3줄까지)
 * 본문 <p> 안의 말풍선에서도 쓰이므로 구문 콘텐츠(span)만 쓰고 block 으로 배치한다.
 */
export function OpinionPeek({ opinion }: { opinion: OpinionItemFieldsFragment }) {
  return (
    <>
      <span className="block text-xs text-neutral-500">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {opinion.user?.nickname ?? '알 수 없음'}
        </span>
        <span className="ml-1 text-neutral-400">@{opinion.sid}</span>
      </span>
      {isDeletedOpinion(opinion) ? (
        <span className="mt-1 block italic text-neutral-400">삭제된 의견입니다.</span>
      ) : (
        <span className="mt-1 line-clamp-3 whitespace-pre-wrap break-words">
          <OpinionTypeBadge type={opinion.type} />
          {maskBlocked(blockedAwareContent(opinion))}
        </span>
      )}
    </>
  )
}
