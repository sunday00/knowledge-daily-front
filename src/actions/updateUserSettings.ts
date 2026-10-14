import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { USER_INFO_QUERY } from '@/graphql/queries/userInfo.ts'
import { USER_UPDATE_MUTATION } from '@/graphql/mutations/user.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import type { LinkDraft } from '@/components/LinksEditor.tsx'

export type UserSettingsDraft = {
  nickname: string
  links: LinkDraft[]
}

export function useUpdateUserSettings() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: saving }] = useMutation(USER_UPDATE_MUTATION, {
    refetchQueries: [USER_INFO_QUERY],
    awaitRefetchQueries: true,
  })

  const submit = async (draft: UserSettingsDraft): Promise<void> => {
    setError(null)

    const trimmedNickname = draft.nickname.trim()
    if (!trimmedNickname) {
      setError('닉네임을 입력하세요.')
      return
    }

    const cleanedLinks = draft.links
      .map((l) => ({ href: l.href.trim(), label: l.label.trim() }))
      .filter((l) => l.href.length > 0)

    const invalid = cleanedLinks.find((l) => !/^https?:\/\//i.test(l.href))
    if (invalid) {
      setError(`유효하지 않은 URL: ${invalid.href} (http:// 또는 https:// 로 시작해야 합니다)`)
      return
    }

    try {
      const { data, errors } = await mutate({
        variables: {
          input: {
            nickname: trimmedNickname,
            links: cleanedLinks.map((l) => ({
              href: l.href,
              label: l.label.length > 0 ? l.label : undefined,
            })),
          },
        },
      })
      if (errors?.length) {
        setError(errors.map((e) => e.message).join(', '))
        return
      }
      const result = data?.UserMutation.userUpdate
      if (!result || !result.success) {
        setError(result?.message ?? '서버가 실패를 반환했습니다.')
        return
      }

      updateUser({ nickname: trimmedNickname })
      navigate('/user/settings', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return { submit, saving, error }
}
