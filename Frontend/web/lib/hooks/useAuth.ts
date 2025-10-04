// Hook para manejar autenticación
import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { AuthUser, login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, isAuthenticated, getStoredUser } from '../api/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithFirebase: (firebaseToken: string) => Promise<void>
  register: (userData: {
    email: string
    first_name: string
    last_name: string
    phone?: string
    firebase_uid?: string
  }) => Promise<void>
  logout: () => Promise<void>
  mockLogin: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          const storedUser = getStoredUser()
          if (storedUser) {
            setUser(storedUser)
            // Optionally, verify with server
            try {
              const currentUser = await getCurrentUser()
              setUser(currentUser)
            } catch (error) {
              console.log('Could not verify user with server, using stored data')
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // For now, this will use mock authentication
      // In production, this would integrate with Firebase Auth
      console.log('Mock login for:', email)
      
      // Generate mock Firebase token
      const mockFirebaseToken = `mock_token_${email.split('@')[0]}`
      const result = await apiLogin(mockFirebaseToken)
      
      setUser(result.user)
      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithFirebase = async (firebaseToken: string) => {
    setLoading(true)
    try {
      const result = await apiLogin(firebaseToken)
      setUser(result.user)
      console.log('Firebase login successful')
    } catch (error) {
      console.error('Firebase login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    first_name: string
    last_name: string
    phone?: string
    firebase_uid?: string
  }) => {
    setLoading(true)
    try {
      // Generate mock Firebase UID if not provided
      const firebaseUid = userData.firebase_uid || `mock_uid_${userData.email.split('@')[0]}_${Date.now()}`
      
      const result = await apiRegister({
        ...userData,
        firebase_uid: firebaseUid
      })
      
      console.log('Registration successful:', result.email)
      // After registration, user needs to login
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await apiLogout()
      setUser(null)
      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user even if API call fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Mock login function for development/testing
  const mockLogin = async (email: string) => {
    setLoading(true)
    try {
      console.log('Mock login for:', email)
      
      // Generate mock Firebase token based on email
      const mockFirebaseToken = `mock_token_${email.split('@')[0]}`
      const result = await apiLogin(mockFirebaseToken)
      
      setUser(result.user)
      console.log('Mock login successful')
    } catch (error) {
      console.error('Mock login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    loginWithFirebase,
    register,
    logout,
    mockLogin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook para requerir autenticación
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login page
      window.location.href = '/login'
    }
  }, [user, loading])

  return { user, loading }
}