import { SafeImage } from '@/components/SafeImage.tsx'
import { ProfileImoji } from '@/components/profile/ProfileImoji.tsx'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { useMyArchive } from '@/hooks/useMyArchive.ts'

/** 프로필을 그리는 데 필요한 user.archive 의 일부 */
export type AvatarArchive = {
  img?: { current?: { code: string; type: string } | null } | null
  attaches: { sortKey: number; attach: { src?: unknown } }[]
} | null

/** CUSTOM 프로필 이미지 주소: archive 첨부 중 첫 번째. 작은 크기를 먼저 쓴다. */
function customSrc(archive: NonNullable<AvatarArchive>): string | undefined {
  const first = [...archive.attaches].sort((a, z) => a.sortKey - z.sortKey)[0]?.attach
  const src = (first?.src ?? {}) as Record<string, string>
  return src.thumbnail ?? src.preview ?? src.full ?? Object.values(src)[0]
}

/**
 * 사용자 프로필 그림.
 * IMOJI 는 code 를 이모지로, CUSTOM 은 archive 첨부 이미지로, 고른 게 없으면 기본 사람 아이콘.
 * userId 가 나면 서버 응답 대신 로컬의 내 archive(auth_archive)를 써서, 프로필을 바꾸면 새로고침 없이 바로 바뀐다.
 */
export function UserAvatar({
  archive: given,
  userId,
  size = 20,
  className = '',
}: {
  archive?: AvatarArchive
  /** 이 프로필의 주인. 나면 로컬의 내 archive 를 쓴다. */
  userId?: string | null
  size?: number
  className?: string
}) {
  const { user } = useAuth()
  const mine = useMyArchive()
  const archive = userId && userId === user?.userId && mine ? mine : given
  const current = archive?.img?.current
  const box = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`
  const style = { width: size, height: size }

  if (current?.type === 'IMOJI') {
    return (
      <span aria-hidden className={box} style={style}>
        <ProfileImoji img={current} size={size} />
      </span>
    )
  }
  if (current?.type === 'CUSTOM' && archive) {
    const src = customSrc(archive)
    if (src) {
      return (
        <SafeImage
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className={`${box} object-cover`}
          style={style}
        />
      )
    }
  }
  return (
    <span
      aria-hidden
      className={`${box} bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300`}
      style={style}
    >
      <svg viewBox="0 0 24 24" width={size * 0.7} height={size * 0.7} fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7z" />
      </svg>
    </span>
  )
}
