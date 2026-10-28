import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import { SENSE_ADD_MY_MUTATION, SENSE_REMOVE_MY_MUTATION } from '@/graphql/mutations/sense.ts'
import { reportError } from '@/lib/errorReporter.ts'
import { resetMyListCaches } from '@/lib/senseMyListCache.ts'

/** 내 상식에 추가. 이미 있어도 서버가 성공으로 처리한다. */
export function useAddMySense() {
  const client = useApolloClient()
  const [added, setAdded] = useState(false)
  const [mutate, { loading }] = useMutation(SENSE_ADD_MY_MUTATION)

  const add = async (senseId: string) => {
    try {
      const { data } = await mutate({ variables: { input: { _id: senseId } } })
      const res = data?.SenseMutation.addMySense
      if (!res?.success) throw new Error(res?.message ?? '서버가 실패를 반환했습니다.')
      setAdded(true)
      // 내 Knowledge 목록에 바로 보이도록 다시 받게 한다.
      resetMyListCaches(client)
    } catch (e: unknown) {
      reportError('[내 상식 추가 실패]', e)
    }
  }

  return { add, added, loading }
}

/** 내 상식에서 제외. 성공하면 목록을 다시 받아 카드가 빠진다. */
export function useRemoveMySense() {
  const client = useApolloClient()
  const [mutate, { loading }] = useMutation(SENSE_REMOVE_MY_MUTATION)

  const remove = async (senseId: string) => {
    try {
      const { data } = await mutate({ variables: { input: { _id: senseId } } })
      const res = data?.SenseMutation.removeMySense
      if (!res?.success) throw new Error(res?.message ?? '서버가 실패를 반환했습니다.')
      resetMyListCaches(client)
    } catch (e: unknown) {
      reportError('[내 상식 제외 실패]', e)
    }
  }

  return { remove, loading }
}
