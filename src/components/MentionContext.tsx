import { createContext, useContext, useState, type ReactNode } from 'react'

type InsertMention = (sid: number) => void

type MentionContextValue = {
  /** 입력창이 떠 있으면 함수, 아니면(비로그인 등) null */
  insertMention: InsertMention | null
  /** 입력창이 자신의 삽입 함수를 등록/해제한다 */
  register: (fn: InsertMention | null) => void
}

const MentionContext = createContext<MentionContextValue | null>(null)

/** 의견 목록의 @sid 를 누르면 하단 입력창에 '@sid ' 를 넣을 수 있게 둘을 잇는다. */
export function MentionProvider({ children }: { children: ReactNode }) {
  const [insertMention, setInsertMention] = useState<InsertMention | null>(null)

  return (
    <MentionContext.Provider
      // setState 에 함수를 그대로 넘기면 updater 로 실행되므로 한 번 감싼다
      value={{ insertMention, register: (fn) => setInsertMention(() => fn) }}
    >
      {children}
    </MentionContext.Provider>
  )
}

export const useMention = () => useContext(MentionContext)
