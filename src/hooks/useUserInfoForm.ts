import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { USER_INFO_QUERY } from '@/graphql/queries/userInfo.ts'
import type { LinkDraft } from '@/components/LinksEditor.tsx'

export function useUserInfoForm() {
  const { data, loading } = useQuery(USER_INFO_QUERY, { fetchPolicy: 'cache-first' })
  const [nickname, setNickname] = useState('')
  const [links, setLinks] = useState<LinkDraft[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const item = data?.UserQuery.info.item
    if (item && !initialized) {
      setNickname(item.nickname)
      setLinks(item.links.map((l) => ({ href: l.href, label: l.label ?? '' })))
      setInitialized(true)
    }
  }, [data, initialized])

  return {
    nickname,
    setNickname,
    links,
    setLinks,
    loading: loading && !data,
  }
}
