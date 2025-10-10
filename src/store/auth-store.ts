import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth } from '@devvai/devv-code-backend'

interface User {
  projectId: string
  uid: string
  name: string
  email: string
  createdTime: number
  lastLoginTime: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  sendOTP: (email: string) => Promise<void>
  verifyOTP: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  checkAuthStatus: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      sendOTP: async (email: string) => {
        try {
          set({ isLoading: true, error: null })
          
          // Development mode: Skip real OTP for testing
          if (import.meta.env.DEV) {
            console.log('🔧 Development Mode: Simulating OTP send for', email)
            await new Promise(resolve => setTimeout(resolve, 500))
            set({ isLoading: false })
            return
          }
          
          await auth.sendOTP(email)
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send OTP (Status: 400). Using dev mode - any 6-digit code will work.',
            isLoading: false 
          })
          // Don't throw in dev mode, allow proceeding
          if (import.meta.env.DEV) {
            console.warn('OTP send failed, but continuing in dev mode')
          } else {
            throw error
          }
        }
      },

      verifyOTP: async (email: string, code: string) => {
        try {
          set({ isLoading: true, error: null })
          
          // Development mode: Accept any 6-digit code
          if (import.meta.env.DEV) {
            console.log('🔧 Development Mode: Simulating OTP verification')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const mockUser: User = {
              projectId: 'dev-project-' + Date.now(),
              uid: 'dev-user-' + Date.now(),
              name: email.split('@')[0],
              email: email,
              createdTime: Date.now(),
              lastLoginTime: Date.now()
            }
            
            set({ 
              user: mockUser,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return
          }
          
          const response = await auth.verifyOTP(email, code)
          set({ 
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          // In dev mode, accept any code if real verification fails
          if (import.meta.env.DEV) {
            console.warn('OTP verification failed, using dev mode bypass')
            const mockUser: User = {
              projectId: 'dev-project-' + Date.now(),
              uid: 'dev-user-' + Date.now(),
              name: email.split('@')[0],
              email: email,
              createdTime: Date.now(),
              lastLoginTime: Date.now()
            }
            
            set({ 
              user: mockUser,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            set({ 
              error: error instanceof Error ? error.message : 'Invalid verification code',
              isLoading: false 
            })
            throw error
          }
        }
      },

      logout: async () => {
        try {
          await auth.logout()
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          })
        } catch (error) {
          // Even if logout fails, clear local state
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          })
        }
      },

      clearError: () => set({ error: null }),

      checkAuthStatus: () => {
        const sid = localStorage.getItem('DEVV_CODE_SID')
        const isAuth = !!sid && get().isAuthenticated
        if (!isAuth) {
          set({ user: null, isAuthenticated: false })
        }
        return isAuth
      }
    }),
    {
      name: 'claude-agent-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)