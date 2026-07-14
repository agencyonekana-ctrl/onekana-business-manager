import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { remoteApi } from '../services/remote-api'
import { unwrapApiData } from '../services/api-client'
import type { AuthUser } from '../types/auth'
import { clearAccessToken, setAccessToken } from '../lib/auth-session'
import { clearLegacyAuthToken } from '../lib/session-storage'

type LoginCredentials = {
  email: string
  password: string
}

type LoginPayload = {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    clearLegacyAuthToken()

    async function restoreSession() {
      try {
        const payload = unwrapApiData<LoginPayload>(await remoteApi.auth.refresh())
        setAccessToken(payload.access_token)
        if (isMounted) setUser(payload.user)
      } catch {
        clearAccessToken()
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleExpired = () => setUser(null)
    window.addEventListener('onekana:auth-expired', handleExpired)
    return () => window.removeEventListener('onekana:auth-expired', handleExpired)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const payload = unwrapApiData<LoginPayload>(await remoteApi.auth.login(credentials))
    setAccessToken(payload.access_token)
    setUser(payload.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await remoteApi.auth.logout()
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
  }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
