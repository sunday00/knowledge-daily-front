import { useState } from 'react'
import { ApolloError, useMutation } from '@apollo/client'
import {
  ARCHIVE_ACHIEVEMENT_APPLY_MUTATION,
  ARCHIVE_ACHIEVEMENT_APPLY_SET_MUTATION,
} from '@/graphql/mutations/archive.ts'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'
import { syncArchiveAchievements } from '@/lib/authStorage.ts'
import { ACHIEVEMENT_APPLY_LIMIT } from '@/lib/achievement.ts'

const ERROR_TEXT: Record<string, string> = {
  ACHIEVEMENT_NOT_AVAILABLE: '아직 달성하지 않은 도전과제입니다.',
  ACHIEVEMENT_APPLY_LIMIT: `칭호는 ${ACHIEVEMENT_APPLY_LIMIT}개까지 적용할 수 있습니다.`,
  ACHIEVEMENT_APPLY_DUPLICATED: '같은 칭호가 두 번 들어 있습니다.',
}

const errorCodeOf = (e: unknown) =>
  e instanceof ApolloError
    ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
    : undefined

/**
 * 칭호 추가 (archiveAchievementApply 토글을 적용 안 된 것에만 쓴다. 맨 뒤 순위로 붙는다).
 * 개수가 넘치면 서버 에러를 message 로 알린다. 결과 achievements 는 로컬(auth_archive)에도 반영한다.
 */
export function useAchievementApply() {
  const [message, setMessage] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [mutate] = useMutation(ARCHIVE_ACHIEVEMENT_APPLY_MUTATION, {
    // 결과는 화면에 직접 보여 주므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
    refetchQueries: [ARCHIVE_MY_QUERY],
  })

  const add = async (id: string) => {
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
      const code = errorCodeOf(e)
      setMessage(
        (code && ERROR_TEXT[code]) ?? '칭호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setPendingId(null)
    }
  }

  return { add, pendingId, message }
}

/**
 * 칭호 통째로 저장. names 순서가 곧 우선순위. 실패하면 서버 값은 그대로라 false 를 돌려주고 message 로 알린다.
 * 결과 achievements 는 로컬(auth_archive)에도 반영한다.
 */
export function useAchievementApplySet() {
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [mutate] = useMutation(ARCHIVE_ACHIEVEMENT_APPLY_SET_MUTATION, {
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
    refetchQueries: [ARCHIVE_MY_QUERY],
  })

  const save = async (names: string[]): Promise<boolean> => {
    setMessage(null)
    setSaving(true)
    try {
      const { data } = await mutate({ variables: { input: { names } } })
      const res = data?.ArchiveMutation.archiveAchievementApplySet
      if (!res?.success) {
        setMessage(res?.message ?? '칭호를 저장하지 못했습니다.')
        return false
      }
      syncArchiveAchievements({ achievements: res.item })
      return true
    } catch (e: unknown) {
      const code = errorCodeOf(e)
      setMessage(
        (code && ERROR_TEXT[code]) ?? '칭호를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, message }
}
