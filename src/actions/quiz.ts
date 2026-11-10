import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import {
  QUIZ_ANSWER_CREATE_MUTATION,
  QUIZ_CREATE_MUTATION,
  QUIZ_ITEM_UPDATE_MUTATION,
  QUIZ_ITEMS_CREATE_MUTATION,
  QUIZ_UPDATE_MUTATION,
} from '@/graphql/mutations/quiz.ts'
import { QUIZ_ONE_QUERY } from '@/graphql/queries/quiz.ts'
import { QUIZ_BRIEF_MAX, QUIZ_TITLE_MAX, senseInfosOf, type QuizItemDraft } from '@/lib/quiz.ts'

export type QuizSetDraft = {
  title: string
  brief: string
  description: string
  /** 태그 이름. 없는 태그는 서버가 새로 만들어 연결한다. */
  tagNames: string[]
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

function validateSet(draft: QuizSetDraft): string | null {
  const title = draft.title.trim()
  if (!title) return '제목을 입력하세요.'
  if (title.length > QUIZ_TITLE_MAX) return `제목은 ${QUIZ_TITLE_MAX}자 이내로 입력하세요.`
  if (draft.brief.trim().length > QUIZ_BRIEF_MAX)
    return `소제목은 ${QUIZ_BRIEF_MAX}자 이내로 입력하세요.`
  return null
}

/** 퀴즈 만들기 1단계: 퀴즈 세트 생성. 성공하면 새 퀴즈 id (DRAFT) */
export function useCreateQuiz() {
  const [error, setError] = useState<string | null>(null)
  const [create, { loading }] = useMutation(QUIZ_CREATE_MUTATION)

  const submit = async (draft: QuizSetDraft): Promise<string | null> => {
    setError(null)
    const invalid = validateSet(draft)
    if (invalid) return (setError(invalid), null)

    try {
      const { data, errors } = await create({
        variables: {
          input: {
            title: draft.title.trim(),
            brief: draft.brief.trim() || undefined,
            description: draft.description.trim() || undefined,
            tagNames: draft.tagNames,
          },
        },
      })
      if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), null)
      const res = data?.QuizMutation.quizCreate
      if (!res?.success) return (setError(res?.message ?? '서버가 실패를 반환했습니다.'), null)
      return res.item.id
    } catch (e: unknown) {
      setError(messageOf(e))
      return null
    }
  }

  return { submit, saving: loading, error }
}

/**
 * 퀴즈 세트 완료: 임시 저장한 문항을 한 번에(bulk) 만들고 퀴즈를 공개(ACTIVE)로 바꾼다.
 * 문항만 들어가고 공개가 실패하면 다시 눌러도 문항이 겹치지 않게 itemsCreated 를 기억해 둔다.
 */
export function useCompleteQuiz(quizId: string) {
  const client = useApolloClient()
  const [error, setError] = useState<string | null>(null)
  const [itemsCreated, setItemsCreated] = useState(false)
  const [createItems, { loading: creating }] = useMutation(QUIZ_ITEMS_CREATE_MUTATION)
  const [update, { loading: updating }] = useMutation(QUIZ_UPDATE_MUTATION)

  const complete = async (items: QuizItemDraft[]): Promise<boolean> => {
    setError(null)
    if (items.length === 0) return (setError('문항을 하나 이상 만드세요.'), false)

    try {
      if (!itemsCreated) {
        const { data, errors } = await createItems({
          variables: {
            input: {
              quiz: quizId,
              items: items.map((item, i) => ({
                ask: item.ask.trim(),
                answer: item.answer.trim(),
                answerOptions: item.answerOptions.map((o) => o.trim()),
                flags: [],
                sortKey: i + 1,
                senses: senseInfosOf(item.senses),
              })),
            },
          },
        })
        if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
        const res = data?.QuizMutation.quizItemsCreate
        if (!res?.success || !res.item)
          return (setError(res?.message ?? '문항을 저장하지 못했습니다.'), false)
        setItemsCreated(true)
      }

      const { data, errors } = await update({
        variables: { input: { _id: quizId, status: 'ACTIVE' } },
      })
      if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
      const res = data?.QuizMutation.quizUpdate
      if (!res?.success || !res.item)
        return (setError(res?.message ?? '퀴즈를 공개하지 못했습니다.'), false)

      // 퀴즈 목록을 다시 받게 한다.
      client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'QuizQuery' })
      client.cache.gc()
      return true
    } catch (e: unknown) {
      setError(messageOf(e))
      return false
    }
  }

  return { complete, saving: creating || updating, itemsCreated, error }
}

/** 퀴즈 세트 수정 (제목, 소제목, 소개글, 태그). 태그는 보낸 목록으로 통째로 바뀐다. */
export function useUpdateQuiz(quizId: string) {
  const [error, setError] = useState<string | null>(null)
  const [update, { loading }] = useMutation(QUIZ_UPDATE_MUTATION, {
    refetchQueries: [{ query: QUIZ_ONE_QUERY, variables: { input: { _id: quizId } } }],
    awaitRefetchQueries: true,
  })

  const submit = async (draft: QuizSetDraft): Promise<boolean> => {
    setError(null)
    const invalid = validateSet(draft)
    if (invalid) return (setError(invalid), false)

    try {
      const { data, errors } = await update({
        variables: {
          input: {
            _id: quizId,
            title: draft.title.trim(),
            // 비우면 지우도록 빈 문자열을 그대로 보낸다.
            brief: draft.brief.trim(),
            description: draft.description.trim(),
            tagNames: draft.tagNames,
          },
        },
      })
      if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
      const res = data?.QuizMutation.quizUpdate
      if (!res?.success || !res.item)
        return (setError(res?.message ?? '서버가 실패를 반환했습니다.'), false)
      return true
    } catch (e: unknown) {
      setError(messageOf(e))
      return false
    }
  }

  return { submit, saving: loading, error }
}

/**
 * 공개된 내 퀴즈의 문항 저장.
 * - itemId 가 있으면 그 문항 수정 (quizItemUpdate)
 * - 없으면 맨 뒤(sortKey)에 새 문항 하나 추가 (quizItemsCreate)
 * 성공하면 퀴즈를 다시 받아 화면에 반영한다.
 */
export function useSaveQuizItem(quizId: string) {
  const [error, setError] = useState<string | null>(null)
  const refetch = {
    refetchQueries: [{ query: QUIZ_ONE_QUERY, variables: { input: { _id: quizId } } }],
    awaitRefetchQueries: true,
  }
  const [update, { loading: updating }] = useMutation(QUIZ_ITEM_UPDATE_MUTATION, refetch)
  const [create, { loading: creating }] = useMutation(QUIZ_ITEMS_CREATE_MUTATION, refetch)

  const save = async (
    value: Omit<QuizItemDraft, 'key'>,
    target: { itemId: string } | { sortKey: number },
  ): Promise<boolean> => {
    setError(null)
    const body = {
      ask: value.ask.trim(),
      answer: value.answer.trim(),
      answerOptions: value.answerOptions.map((o) => o.trim()),
      senses: senseInfosOf(value.senses),
    }

    try {
      if ('itemId' in target) {
        const { data, errors } = await update({
          variables: { input: { _id: target.itemId, ...body } },
        })
        if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
        const res = data?.QuizMutation.quizItemUpdate
        if (!res?.success || !res.item)
          return (setError(res?.message ?? '문항을 고치지 못했습니다.'), false)
      } else {
        const { data, errors } = await create({
          variables: {
            input: { quiz: quizId, items: [{ ...body, flags: [], sortKey: target.sortKey }] },
          },
        })
        if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
        const res = data?.QuizMutation.quizItemsCreate
        if (!res?.success || !res.item)
          return (setError(res?.message ?? '문항을 추가하지 못했습니다.'), false)
      }
      return true
    } catch (e: unknown) {
      setError(messageOf(e))
      return false
    }
  }

  return { save, saving: updating || creating, error }
}

/**
 * 풀이 기록 저장. 다 풀었을 때 한 번 보낸다.
 * 성공하면 퀴즈 목록·상세의 내 풀이 상태(me)가 바뀌므로 퀴즈 캐시를 비운다.
 */
export function useSaveQuizAnswer(quizId: string) {
  const client = useApolloClient()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [create, { loading }] = useMutation(QUIZ_ANSWER_CREATE_MUTATION)

  const save = async (answers: { quizItem: string; answer: string; correct: boolean }[]) => {
    setError(null)
    setSaved(false)
    try {
      const { data, errors } = await create({
        variables: { input: { quiz: quizId, answers } },
      })
      if (errors?.length) return setError(errors.map((e) => e.message).join(', '))
      const res = data?.QuizMutation.quizAnswerCreate
      if (!res?.success) return setError(res?.message ?? '기록을 저장하지 못했습니다.')
      setSaved(true)
      client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'QuizQuery' })
      client.cache.gc()
    } catch (e: unknown) {
      setError(messageOf(e))
    }
  }

  return { save, saving: loading, saved, error }
}
