import { useState } from 'react'
import { ApolloError, useMutation } from '@apollo/client'
import { ARCHIVE_ACHIEVEMENT_APPLY_MUTATION } from '@/graphql/mutations/archive.ts'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { syncArchiveAchievements } from '@/lib/authStorage.ts'
import { ACHIEVEMENT_APPLY_LIMIT } from '@/lib/achievement.ts'

const ERROR_TEXT: Record<string, string> = {
  ACHIEVEMENT_NOT_AVAILABLE: '아직 달성하지 않은 도전과제입니다.',
  ACHIEVEMENT_APPLY_LIMIT: `칭호는 ${ACHIEVEMENT_APPLY_LIMIT}개까지 적용할 수 있습니다.`,
}

/** 칭호 적용 토글. 적용돼 있으면 해제, 아니면 적용. 결과 achievements 는 로컬(auth_archive)에도 반영한다. */
export function useAchievementApply() {
  const [message, setMessage] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [mutate] = useMutation(ARCHIVE_ACHIEVEMENT_APPLY_MUTATION, {
    // 결과는 화면에 직접 보여 주므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
    refetchQueries: [ARCHIVE_MY_QUERY],
  })

  const toggle = async (id: string) => {
    setMessage(null)
    setPendingId(id)
    try {
      const { data } = await mutate({ variables: { input: { id } } })
      const res = data?.ArchiveMutation.archiveAchievementApply
      if (!res?.success) {
        setMessage(res?.message ?? '칭호를 바꾸지 못했습니다.')
        return
      }
      syncArchiveAchievements({ achievements: res.item })
    } catch (e: unknown) {
      const code =
        e instanceof ApolloError
          ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
          : undefined
      setMessage(
        (code && ERROR_TEXT[code]) ?? '칭호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setPendingId(null)
    }
  }

  return { toggle, pendingId, message }
}
