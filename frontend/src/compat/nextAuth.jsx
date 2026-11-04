import { useMemo } from 'react'

export function SessionProvider({ children }) {
  return children
}

export function useSession() {
  return useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return { data: user ? { user } : null, status: user ? 'authenticated' : 'unauthenticated' }
    } catch {
      return { data: null, status: 'unauthenticated' }
    }
  }, [])
}

export async function signOut(options = {}) {
  const token = localStorage.getItem('token')
  if (token) {
    await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = options.callbackUrl || '/login'
}
