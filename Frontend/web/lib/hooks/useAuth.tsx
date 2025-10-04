// Hook para manejar autenticación
import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../firebase'
import { AuthUser, login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, isAuthenticated, getStoredUser } from '../api/auth'

interface AuthContextType {
  user: AuthUser | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role?: 'user' | 'landlord' | 'agent'
    national_id?: string
    national_id_type?: string
    agency_name?: string
    agency_ruc?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser?.email || 'No user')
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        
        // Get our backend user data
        try {
          const storedUser = getStoredUser()
          if (storedUser) {
            setUser(storedUser)
          } else {
            // Try to get from server
            const currentUser = await getCurrentUser()
            setUser(currentUser)
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔐 Logging in with Firebase:', email)
      
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      console.log('✅ Firebase login successful')
      
      // 2. Get Firebase ID token
      const idToken = await firebaseUser.getIdToken()
      console.log('🎫 Got Firebase ID token:', idToken.substring(0, 50) + '...')
      console.log('🎫 Full token length:', idToken.length)
      
      // 3. Login to our backend with Firebase token
      const result = await apiLogin(idToken)
      
      setUser(result.user)
      console.log('✅ Backend login successful')
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      
      // Handle Firebase-specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            throw new Error('Usuario no encontrado. ¿Necesitas registrarte?')
          case 'auth/wrong-password':
            throw new Error('Contraseña incorrecta.')
          case 'auth/invalid-email':
            throw new Error('Email inválido.')
          case 'auth/user-disabled':
            throw new Error('Esta cuenta ha sido deshabilitada.')
          case 'auth/too-many-requests':
            throw new Error('Demasiados intentos fallidos. Intenta más tarde.')
          default:
            throw new Error('Error al iniciar sesión. Por favor, inténtalo de nuevo.')
        }
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role?: 'user' | 'landlord' | 'agent'
    national_id?: string
    national_id_type?: string
    agency_name?: string
    agency_ruc?: string
  }) => {
    setLoading(true)
    try {
      console.log('📝 Registering with Firebase:', userData.email)
      
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      const firebaseUser = userCredential.user
      
      console.log('✅ Firebase user created:', firebaseUser.uid)
      
      // 2. Register in our backend
      const { password, ...userDataWithoutPassword } = userData
      const result = await apiRegister({
        ...userDataWithoutPassword,
        firebase_uid: firebaseUser.uid
      })
      
      console.log('✅ Backend registration successful:', result.email)
      
      // 3. Sign out after registration (user needs to login)
      await signOut(auth)
      
    } catch (error: any) {
      console.error('❌ Registration failed:', error)
      
      // Handle Firebase-specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('El email ya está registrado. Intenta iniciar sesión.')
          case 'auth/invalid-email':
            throw new Error('Email inválido.')
          case 'auth/weak-password':
            throw new Error('La contraseña es muy débil. Debe tener al menos 6 caracteres.')
          case 'auth/operation-not-allowed':
            throw new Error('El registro está deshabilitado temporalmente.')
          default:
            throw new Error('Error al crear la cuenta. Por favor, inténtalo de nuevo.')
        }
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      console.log('🚪 Logging out')
      
      // 1. Logout from backend
      await apiLogout()
      
      // 2. Sign out from Firebase
      await signOut(auth)
      
      setUser(null)
      setFirebaseUser(null)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Clear user even if API call fails
      setUser(null)
      setFirebaseUser(null)
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isLoggedIn: !!user && !!firebaseUser,
    login,
    register,
    logout
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