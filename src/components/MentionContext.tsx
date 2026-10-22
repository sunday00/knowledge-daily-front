import { createContext, useContext, useState, type ReactNode } from 'react'
import type { OpinionItemFieldsFragment } from '@/graphql/__generated__/graphql.ts'

type InsertMention = (sid: number) => void

/** 화면에 이미 보이는 의견 중 sid 로 찾기 (없으면 undefined) */
export type FindBySid = (sid: number) => OpinionItemFieldsFragment | undefined

type MentionContextValue = {
  /** 입력창이 떠 있으면 함수, 아니면(비로그인 등) null */
  insertMention: InsertMention | null
  /** 입력창이 자신의 삽입 함수를 등록/해제한다 */
  register: (fn: InsertMention | null) => void
  findBySid: FindBySid
  /** 본문의 @sid 링크를 누르면 그 의견으로 이동 */
  jumpToSid: (sid: number) => void
}

const MentionContext = createContext<MentionContextValue | null>(null)

/**
 * 의견 목록과 하단 입력창을 잇는다.
 * - 목록의 @sid 를 누르면 입력창에 '@sid ' 를 넣는다.
 * - 입력창의 @sid 에 커서가 있으면 그 의견을 미리 보여줄 때 화면의 의견에서 먼저 찾는다.
 * - 본문의 @sid 링크를 누르면 그 의견으로 이동한다.
 */
export function MentionProvider({
  children,
  findBySid,
  jumpToSid,
}: {
  children: ReactNode
  findBySid: FindBySid
  jumpToSid: (sid: number) => void
}) {
  const [insertMention, setInsertMention] = useState<InsertMention | null>(null)

  return (
    <MentionContext.Provider
      // setState 에 함수를 그대로 넘기면 updater 로 실행되므로 한 번 감싼다
      value={{
        insertMention,
        register: (fn) => setInsertMention(() => fn),
        findBySid,
        jumpToSid,
      }}
    >
      {children}
    </MentionContext.Provider>
  )
}

export const useMention = () => useContext(MentionContext)
