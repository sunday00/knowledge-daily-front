/** 탈퇴(INACTIVE)한 작성자를 닉네임 대신 보여 줄 이름 */
export const RESIGNED_NICKNAME = '탈퇴한 사용자'

type NicknameUser = { nickname: string; status?: string | null } | null | undefined

/** 탈퇴한 유저인지 (user.status INACTIVE) */
export function isResignedUser(user: NicknameUser): boolean {
  return user?.status === 'INACTIVE'
}

/** 작성자 닉네임. 탈퇴한 유저면 '탈퇴한 사용자'(흐리게), 유저가 없으면 fallback */
export function UserNickname({
  user,
  fallback = '알 수 없음',
  className = '',
}: {
  user: NicknameUser
  fallback?: string
  className?: string
}) {
  if (isResignedUser(user)) {
    return (
      <span className={`text-neutral-400 dark:text-neutral-500 ${className}`}>
        {RESIGNED_NICKNAME}
      </span>
    )
  }
  return <span className={className}>{user?.nickname ?? fallback}</span>
}
