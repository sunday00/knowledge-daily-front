import { useState } from 'react'
import { ApolloError, useMutation, useQuery } from '@apollo/client'
import { EMBED_MY_ONE_QUERY } from '@/graphql/queries/embed.ts'
import {
  EMBED_APPLY_MUTATION,
  EMBED_CODE_REISSUE_MUTATION,
  EMBED_UPDATE_MUTATION,
} from '@/graphql/mutations/embed.ts'

/** 신청/재발급 결과. code 원문은 이 응답에서만 볼 수 있다. */
export type EmbedIssued = { code: string; src: string; imgHtml: string }

const NOT_FOUND = 'EMBED_NOT_FOUND'

/** 입력한 도메인을 호스트만 남긴다. https://my.blog.com/post/1 -> my.blog.com */
export function toHost(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  try {
    return new URL(/^[a-z]+:\/\//.test(v) ? v : `https://${v}`).hostname || null
  } catch {
    return null
  }
}

/** 한 줄에 하나씩 적은 도메인을 호스트 목록으로. 잘못된 줄이 있으면 error */
export function parseDomains(lines: string): { hosts: string[] } | { error: string } {
  const hosts: string[] = []
  for (const line of lines.split('\n')) {
    if (!line.trim()) continue
    const host = toHost(line)
    if (!host) return { error: `도메인 형식이 올바르지 않습니다: ${line.trim()}` }
    if (!hosts.includes(host)) hosts.push(host)
  }
  return { hosts }
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * 내 임베드 신청 상태.
 * embed: 신청 정보 / null = 신청 안 함 / undefined = 아직 모름(불러오는 중, 실패)
 */
export function useMyEmbed() {
  const { data, loading, error, refetch } = useQuery(EMBED_MY_ONE_QUERY, {
    fetchPolicy: 'cache-and-network',
    // 신청 안 한 상태는 에러로 오지만 화면에서 처리하므로 에러 배너엔 띄우지 않는다.
    context: { expectedErrorCodes: [NOT_FOUND] },
  })
  const notApplied =
    error instanceof ApolloError &&
    error.graphQLErrors.some((g) => g.extensions?.code === NOT_FOUND)
  const res = data?.EmbedQuery.embedMyOne
  const embed = notApplied ? null : res?.success ? res.item : undefined

  return {
    embed,
    loading: loading && !data && !notApplied,
    error: error && !notApplied ? error.message : null,
    refetch,
  }
}

/** 신청 / 코드 재발급 / 도메인 수정. 끝나면 내 신청 상태를 다시 받는다. */
export function useEmbedActions() {
  const refetchQueries = [EMBED_MY_ONE_QUERY]
  const [applyMut, { loading: applying }] = useMutation(EMBED_APPLY_MUTATION, { refetchQueries })
  const [reissueMut, { loading: reissuing }] = useMutation(EMBED_CODE_REISSUE_MUTATION, {
    refetchQueries,
  })
  const [updateMut, { loading: updating }] = useMutation(EMBED_UPDATE_MUTATION)
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<EmbedIssued | null>(null)

  const pickIssued = (
    res: { success: number; message?: string | null; item: EmbedIssued } | undefined,
  ) => {
    if (!res?.success) {
      setError(res?.message ?? '서버가 실패를 반환했습니다.')
      return false
    }
    setIssued({ code: res.item.code, src: res.item.src, imgHtml: res.item.imgHtml })
    return true
  }

  /** 신청. 성공하면 true */
  const apply = async (domainLines: string): Promise<boolean> => {
    setError(null)
    const parsed = parseDomains(domainLines)
    if ('error' in parsed) {
      setError(parsed.error)
      return false
    }
    try {
      const { data } = await applyMut({ variables: { input: { allowedDomains: parsed.hosts } } })
      return pickIssued(data?.EmbedMutation.embedApply)
    } catch (e) {
      setError(messageOf(e))
      return false
    }
  }

  /** 새 코드 발급. 성공하면 true */
  const reissue = async (): Promise<boolean> => {
    setError(null)
    try {
      const { data } = await reissueMut()
      return pickIssued(data?.EmbedMutation.embedCodeReissue)
    } catch (e) {
      setError(messageOf(e))
      return false
    }
  }

  /** 허용 도메인 수정. 성공하면 true (응답의 Embed 로 캐시가 바로 바뀐다) */
  const updateDomains = async (domainLines: string): Promise<boolean> => {
    setError(null)
    const parsed = parseDomains(domainLines)
    if ('error' in parsed) {
      setError(parsed.error)
      return false
    }
    try {
      const { data } = await updateMut({ variables: { input: { allowedDomains: parsed.hosts } } })
      const res = data?.EmbedMutation.embedUpdate
      if (!res?.success) {
        setError(res?.message ?? '서버가 실패를 반환했습니다.')
        return false
      }
      return true
    } catch (e) {
      setError(messageOf(e))
      return false
    }
  }

  return {
    apply,
    reissue,
    updateDomains,
    busy: applying || reissuing || updating,
    error,
    issued,
    clearIssued: () => setIssued(null),
  }
}
