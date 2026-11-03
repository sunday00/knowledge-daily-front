import { useSyncExternalStore } from 'react'
import { getArchive, subscribeArchive, type StoredArchive } from '@/lib/authStorage.ts'

/** 로컬에 저장된 내 archive (auth_archive). 프로필을 바꾸면 새로고침 없이 바로 바뀐다. */
export function useMyArchive(): StoredArchive | null {
  return useSyncExternalStore(subscribeArchive, getArchive)
}
