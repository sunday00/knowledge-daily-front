import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearSession,
  getNickname,
  getUserId,
  saveSession,
  updateNickname,
  type StoredArchive,
} from '../lib/authStorage'
import { setUserPoint } from '../lib/userPoint'

type AuthUser = { userId: string; nickname: string }

type AuthContextValue = {
  user: AuthUser | null
  /** 이 화면에서 마지막으로 로그인한 시각. 로그인할 때마다 바뀐다 (새로고침 뒤 로그인 유지면 0) */
  signedInAt: number
  signIn: (payload: AuthUser & { archive?: StoredArchive | null }) => void
  signOut: () => void
  updateUser: (partial: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitial(): AuthUser | null {
  const userId = getUserId()
  const nickname = getNickname()
  if (!userId || !nickname) return null
  return { userId, nickname }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readInitial)
  const [signedInAt, setSignedInAt] = useState(0)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signedInAt,
      signIn: ({ userId, nickname, archive }) => {
        saveSession({ userId, nickname, archive })
        setUser({ userId, nickname })
        setSignedInAt(Date.now())
      },
      signOut: () => {
        clearSession()
        setUserPoint(null)
        setUser(null)
      },
      updateUser: (partial) => {
        setUser((prev) => {
          if (!prev) return prev
          const next = { ...prev, ...partial }
          if (partial.nickname !== undefined) updateNickname(partial.nickname)
          return next
        })
      },
    }),
    [user, signedInAt],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
