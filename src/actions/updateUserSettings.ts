import { useState } from 'react'
import { ApolloError, useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { USER_INFO_QUERY } from '@/graphql/queries/userInfo.ts'
import { USER_UPDATE_MUTATION } from '@/graphql/mutations/user.ts'
import { useAuth } from '@/auth/AuthProvider.tsx'
import type { LinkDraft } from '@/components/LinksEditor.tsx'

export type UserSettingsDraft = {
  nickname: string
  links: LinkDraft[]
}

// 닉네임에 금칙어가 들어 있을 때 서버가 주는 에러. detail[0].word = 걸린 말
const NICKNAME_FORBIDDEN = 'NICKNAME_FORBIDDEN'

/** 금칙어 닉네임 에러면 안내 문구, 아니면 null */
function forbiddenNicknameMessage(e: unknown): string | null {
  if (!(e instanceof ApolloError)) return null
  const err = e.graphQLErrors.find((g) => g.extensions?.code === NICKNAME_FORBIDDEN)
  if (!err) return null
  const word = (err.extensions?.detail as { word?: string }[] | undefined)?.[0]?.word
  return word
    ? `닉네임에 쓸 수 없는 말('${word}')이 들어 있어요. 다른 닉네임으로 바꿔 주세요.`
    : '닉네임에 쓸 수 없는 말이 들어 있어요. 다른 닉네임으로 바꿔 주세요.'
}

export function useUpdateUserSettings() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  // 닉네임 칸 바로 아래에 보여 줄 에러 (금칙어 등)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [mutate, { loading: saving }] = useMutation(USER_UPDATE_MUTATION, {
    refetchQueries: [USER_INFO_QUERY],
    awaitRefetchQueries: true,
    // 금칙어 닉네임은 닉네임 칸에 직접 보여 주므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: [NICKNAME_FORBIDDEN] },
  })

  const submit = async (draft: UserSettingsDraft): Promise<void> => {
    setError(null)
    setNicknameError(null)

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
            links: cleanedLinks.map((l, i) => ({
              // 서버가 링크마다 key 를 요구한다. 사용자 링크엔 따로 이름이 없어 순서로 붙인다.
              key: `link-${i + 1}`,
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
      const forbidden = forbiddenNicknameMessage(e)
      if (forbidden) {
        setNicknameError(forbidden)
        return
      }
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return {
    submit,
    saving,
    error,
    nicknameError,
    /** 닉네임을 고치면 칸 아래 에러를 지운다 */
    clearNicknameError: () => setNicknameError(null),
  }
}
