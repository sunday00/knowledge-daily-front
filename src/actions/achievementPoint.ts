import { useState } from 'react'
import { ApolloError, useApolloClient, useMutation } from '@apollo/client'
import { ACHIEVEMENT_POINT_MUTATION } from '@/graphql/mutations/point.ts'
import { ARCHIVE_MY_QUERY } from '@/graphql/queries/archive.ts'

const ERROR_TEXT: Record<string, string> = {
  ACHIEVEMENT_NOT_AVAILABLE: '아직 달성하지 않은 도전과제입니다.',
  ACHIEVEMENT_POINT_ALREADY_GIVEN: '이미 보상을 받은 도전과제입니다.',
  ACHIEVEMENT_NOT_REWARDED: '보상이 없는 도전과제입니다.',
}
// 지급은 console 이 나중에 한다. 이만큼 뒤에 내 archive 를 다시 받아 pointable(받기 버튼)을 서버 값과 맞춘다.
const ARCHIVE_REFRESH_MS = 3000

/**
 * 도전과제 보상 포인트 받기. 접수되면 그 id 를 claimed 에 넣어 다시 누르지 못하게 하고(지급 예정),
 * 잠시 뒤 내 archive 를 다시 받는다. 보유 포인트는 이후 응답 헤더(x-user-point)로 갱신된다.
 */
export function useAchievementPoint() {
  const client = useApolloClient()
  const [message, setMessage] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<ReadonlySet<string>>(() => new Set())
  const [mutate] = useMutation(ACHIEVEMENT_POINT_MUTATION, {
    // 결과는 화면에 직접 보여 주므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: Object.keys(ERROR_TEXT) },
  })

  const refreshArchive = () => void client.refetchQueries({ include: [ARCHIVE_MY_QUERY] })

  const claim = async (name: string) => {
    setMessage(null)
    setPendingId(name)
    try {
      const { data } = await mutate({ variables: { input: { name } } })
      const res = data?.PointMutation.achievementPoint
      if (!res?.success || !res.item) {
        setMessage(res?.message ?? '지금은 이 도전과제의 보상을 받을 수 없습니다.')
        return
      }
      setClaimed((prev) => new Set(prev).add(name))
      window.setTimeout(refreshArchive, ARCHIVE_REFRESH_MS)
    } catch (e: unknown) {
      const code =
        e instanceof ApolloError
          ? (e.graphQLErrors[0]?.extensions?.code as string | undefined)
          : undefined
      setMessage(
        (code && ERROR_TEXT[code]) ?? '보상을 받지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      // 이미 받았으면 서버 값으로 맞춰 버튼을 없앤다.
      if (code === 'ACHIEVEMENT_POINT_ALREADY_GIVEN') refreshArchive()
    } finally {
      setPendingId(null)
    }
  }

  return { claim, pendingId, claimed, message }
}
