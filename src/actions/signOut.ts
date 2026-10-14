import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'

export function useSignOut() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  return () => {
    signOut()
    navigate('/', { replace: true })
  }
}
