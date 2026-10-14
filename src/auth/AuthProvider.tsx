import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearSession,
  getNickname,
  getUserId,
  saveSession,
  updateNickname,
} from '../lib/authStorage'

type AuthUser = { userId: string; nickname: string }

type AuthContextValue = {
  user: AuthUser | null
  signIn: (payload: AuthUser) => void
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: ({ userId, nickname }) => {
        saveSession({ userId, nickname })
        setUser({ userId, nickname })
      },
      signOut: () => {
        clearSession()
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
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}