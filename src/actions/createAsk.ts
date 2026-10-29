import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ASK_CREATE_MUTATION } from '@/graphql/mutations/board.ts'

export type AskDraft = { board: string; category: string; quest: string }

/** 문의/요청 글 작성. 성공하면 새 글 id, 실패하면 null (error 에 사유) */
export function useCreateAsk() {
  const [error, setError] = useState<string | null>(null)
  const [mutate, { loading: saving }] = useMutation(ASK_CREATE_MUTATION)

  const submit = async (draft: AskDraft): Promise<string | null> => {
    setError(null)
    const quest = draft.quest.trim()
    if (!draft.category) {
      setError('분류를 선택하세요.')
      return null
    }
    if (!quest) {
      setError('내용을 입력하세요.')
      return null
    }

    try {
      const { data, errors } = await mutate({
        variables: {
          // 첨부는 아직 지원하지 않는다. (필수 필드라 빈 배열)
          input: { board: draft.board, category: draft.category, quest, attaches: [] },
        },
      })
      if (errors?.length) {
        setError(errors.map((e) => e.message).join(', '))
        return null
      }
      const res = data?.BoardMutation.askCreate
      if (!res?.success) {
        setError(res?.message ?? '서버가 실패를 반환했습니다.')
        return null
      }
      return res.item.id
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      return null
    }
  }

  return { submit, saving, error }
}
