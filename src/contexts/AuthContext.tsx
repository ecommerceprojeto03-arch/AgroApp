import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '../services/auth'
import type { UserProfile, UserRole } from '../types'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  register: (data: {
    email: string
    password: string
    name: string
    role: UserRole
    phone?: string
    farmName?: string
  }) => Promise<void>
  completeProfile: (data: {
    uid: string
    email: string
    name: string
    role: UserRole
    phone?: string
    farmName?: string
  }) => Promise<void>
  updateProfile: (data: {
    name: string
    phone?: string
    farmName?: string
  }) => Promise<UserProfile>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = authService.subscribeAuth((profile) => {
      setUser(profile)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const profile = await authService.login(email, password)
    setUser(profile)
    return profile
  }, [])

  const register = useCallback(
    async (data: {
      email: string
      password: string
      name: string
      role: UserRole
      phone?: string
      farmName?: string
    }) => {
      const profile = await authService.register(data)
      setUser(profile)
    },
    [],
  )

  const completeProfile = useCallback(
    async (data: {
      uid: string
      email: string
      name: string
      role: UserRole
      phone?: string
      farmName?: string
    }) => {
      const profile = await authService.completeProfile(data)
      setUser(profile)
    },
    [],
  )

  const updateProfile = useCallback(
    async (data: { name: string; phone?: string; farmName?: string }) => {
      if (!user) throw new Error('Usuário não autenticado.')
      const profile = await authService.updateProfile(user, data)
      setUser(profile)
      return profile
    },
    [user],
  )

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      completeProfile,
      updateProfile,
      logout,
    }),
    [user, loading, login, register, completeProfile, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
