import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

export interface AuthUser {
  id: number
  name: string
  email: string
  login: string
}

interface AuthState {
  user: AuthUser | null
  sessionId: string | null
  isLoading: boolean
  error: string | null

  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const http = axios.create({ baseURL: '/' })

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      sessionId: null,
      isLoading: false,
      error: null,

      login: async (login, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await http.post('/auth/login', { login, password })
          const { session_id, user } = res.data
          set({ sessionId: session_id, user, isLoading: false })
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
            ?? '登录失败，请重试'
          set({ isLoading: false, error: msg })
          throw err
        }
      },

      logout: async () => {
        const { sessionId } = get()
        try {
          await http.post(
            '/auth/logout',
            {},
            { headers: sessionId ? { 'X-Session-Id': sessionId } : {} },
          )
        } catch {
          // 忽略登出错误，本地清除即可
        }
        set({ user: null, sessionId: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ss-auth',           // localStorage key
      partialize: (s) => ({ user: s.user, sessionId: s.sessionId }),
    },
  ),
)
