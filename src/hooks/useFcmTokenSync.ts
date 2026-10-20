import { useCallback, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { USER_UPDATE_MUTATION } from '@/graphql/mutations/user.ts'
import { prepareFcmToken } from '@/lib/firebase.ts'
import { reportError } from '@/lib/errorReporter.ts'

/**
 * 현재 FCM 토큰을 서버(notify__fcm)에 반영하는 함수를 반환한다.
 * 토큰이 준비되지 않았으면(권한 미허용 등) 또는 취소됐으면 false, 반영에 실패하면 throw.
 */
export function useSyncFcmToken() {
  const [mutate] = useMutation(USER_UPDATE_MUTATION)

  return useCallback(
    async (isCancelled: () => boolean = () => false): Promise<boolean> => {
      const token = await prepareFcmToken()
      if (!token || isCancelled()) return false
      const { data } = await mutate({ variables: { input: { notify__fcm: token } } })
      const result = data?.UserMutation.userUpdate
      if (!result?.success) throw new Error(result?.message ?? '알림 토큰 등록에 실패했습니다.')
      return true
    },
    [mutate],
  )
}

/**
 * 로그인 상태에서 이 클라이언트의 FCM 토큰이 준비되면 항상 서버(notify__fcm)에 반영한다.
 * - 로그인/계정 전환 시
 * - 알림 권한이 나중에 허용된 경우 (브라우저 설정 변경 포함)
 * 권한 요청 자체는 설정 페이지의 알림 켜기 버튼에서 한다.
 */
export function useFcmTokenSync() {
  const { user } = useAuth()
  const userId = user?.userId
  const syncFcmToken = useSyncFcmToken()

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const sync = () => {
      syncFcmToken(() => cancelled).catch((e: unknown) => reportError('[FCM] 토큰 등록 실패', e))
    }

    sync()

    let permissionStatus: PermissionStatus | null = null
    const onPermissionChange = () => {
      if (permissionStatus?.state === 'granted') sync()
    }
    navigator.permissions
      ?.query({ name: 'notifications' })
      .then((status) => {
        if (cancelled) return
        permissionStatus = status
        status.addEventListener('change', onPermissionChange)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      permissionStatus?.removeEventListener('change', onPermissionChange)
    }
  }, [userId, syncFcmToken])
}
