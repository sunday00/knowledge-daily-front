import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import { ARTICLE_CREATE_MUTATION, ARTICLE_UPDATE_MUTATION } from '@/graphql/mutations/board.ts'
import { extractHashtags } from '@/lib/hashtags.ts'

export const ARTICLE_TITLE_MAX = 100

export type ArticleDraft = {
  /** 분류가 없는 게시판이면 빈 문자열 */
  category: string
  title: string
  content: string
  /** 올라간 첨부 (attach id + 순서) */
  attaches: { attach: string; sortKey: number }[]
}

/** 입력값 검사. 문제가 있으면 안내 문구 */
function validate(draft: ArticleDraft, needCategory: boolean): string | null {
  if (needCategory && !draft.category) return '분류를 선택하세요.'
  if (!draft.title.trim()) return '제목을 입력하세요.'
  if (draft.title.trim().length > ARTICLE_TITLE_MAX)
    return `제목은 ${ARTICLE_TITLE_MAX}자 이내로 입력하세요.`
  if (!draft.content.trim()) return '내용을 입력하세요.'
  return null
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * 게시글 작성/수정.
 * - create: 성공하면 새 글 id
 * - update: 성공하면 true. 캐시의 그 글을 고쳐 상세로 돌아가면 바로 보인다.
 * 실패하면 null/false 이고 error 에 사유.
 */
export function useSaveArticle() {
  const client = useApolloClient()
  const [error, setError] = useState<string | null>(null)
  const [create, { loading: creating }] = useMutation(ARTICLE_CREATE_MUTATION)
  const [update, { loading: updating }] = useMutation(ARTICLE_UPDATE_MUTATION)

  const submitCreate = async (
    board: string,
    draft: ArticleDraft,
    needCategory: boolean,
  ): Promise<string | null> => {
    setError(null)
    const invalid = validate(draft, needCategory)
    if (invalid) return (setError(invalid), null)

    try {
      const { data, errors } = await create({
        variables: {
          input: {
            board,
            category: draft.category || undefined,
            title: draft.title.trim(),
            content: draft.content.trim(),
            // 태그는 따로 고르지 않고 본문의 #태그를 모아 보낸다. (게시글 전용 태그)
            tagNames: extractHashtags(draft.content),
            attaches: draft.attaches,
          },
        },
      })
      if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), null)
      const res = data?.BoardMutation.articleCreate
      if (!res?.success) return (setError(res?.message ?? '서버가 실패를 반환했습니다.'), null)
      return res.item.id
    } catch (e: unknown) {
      setError(messageOf(e))
      return null
    }
  }

  const submitUpdate = async (
    id: string,
    draft: ArticleDraft,
    needCategory: boolean,
  ): Promise<boolean> => {
    setError(null)
    const invalid = validate(draft, needCategory)
    if (invalid) return (setError(invalid), false)

    const body = {
      category: draft.category || null,
      title: draft.title.trim(),
      content: draft.content.trim(),
      attaches: draft.attaches,
    }
    try {
      const { data, errors } = await update({
        variables: {
          input: {
            _id: id,
            ...body,
            // 본문의 #태그로 통째로 교체한다. (#태그를 다 지웠으면 빈 배열 → 태그 전부 제거)
            tagNames: extractHashtags(body.content),
          },
        },
      })
      if (errors?.length) return (setError(errors.map((e) => e.message).join(', ')), false)
      const res = data?.BoardMutation.articleUpdate
      if (!res?.success) return (setError(res?.message ?? '서버가 실패를 반환했습니다.'), false)
      client.cache.modify({
        id: client.cache.identify({ __typename: 'Article', _id: id }),
        fields: {
          category: () => body.category,
          title: () => body.title,
          content: () => body.content,
          // 첨부는 바뀐 목록을 다시 받아야 주소(src)가 있어 캐시에서 지운다.
          attaches: (_prev, { DELETE }) => DELETE,
        },
      })
      return true
    } catch (e: unknown) {
      setError(messageOf(e))
      return false
    }
  }

  return { submitCreate, submitUpdate, saving: creating || updating, error }
}
