// API utilities for authentication
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types for authentication
export interface LoginRequest {
  firebase_token: string
}

export interface RegisterRequest {
  email: string
  first_name: string
  last_name: string
  phone?: string
  firebase_uid?: string
  role?: 'user' | 'tenant' | 'landlord' | 'agent' | 'admin'
  national_id?: string
  national_id_type?: string
}

export interface RegisterInitRequest {
  email: string
}

export interface RegisterInitResponse {
  can_register: boolean
  email: string
}

export interface RegisterCompleteRequest {
  firebase_token: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role?: 'user' | 'tenant' | 'landlord' | 'agent' | 'admin'
  national_id?: string
  national_id_type?: string
  agency_name?: string
  cleanup_firebase_on_failure?: boolean
}

export interface AuthUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  profile_picture_url?: string
  national_id?: string
  national_id_type?: string
  agency_name?: string  // Para agentes inmobiliarios
  role: string
  is_verified: boolean
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface RegisterResponse extends AuthUser {}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface MessageResponse {
  message: string
}

/**
 * Login with Firebase token
 */
export async function login(firebaseToken: string): Promise<LoginResponse> {
  try {
    console.log('🔐 Attempting login with Firebase token')
    
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        firebase_token: firebaseToken
      }),
    })

    console.log('🔐 Login response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Login error response:', errorText)
      throw new Error(`Login failed: ${response.status} - ${errorText}`)
    }

    const data: LoginResponse = await response.json()
    console.log('✅ Login successful for user:', data.user.email)
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    return data
  } catch (error) {
    console.error('💥 Login error:', error)
    throw error
  }
}

/**
 * Register new user
 * @deprecated Use registerInit + Firebase signup + registerComplete.
 */
export async function register(userData: RegisterRequest): Promise<RegisterResponse> {
  try {
    console.log('📝 Attempting registration for:', userData.email)
    console.warn('⚠️ Deprecated auth.register() used. Prefer registerInit + registerComplete flow.')
    
    const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    console.log('📝 Registration response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Registration error response:', errorText)
      throw new Error(`Registration failed: ${response.status} - ${errorText}`)
    }

    const data: RegisterResponse = await response.json()
    console.log('✅ Registration successful for user:', data.email)
    
    return data
  } catch (error) {
    console.error('💥 Registration error:', error)
    throw error
  }
}

/**
 * Registration step 1: validate email availability in DB and Firebase
 */
export async function registerInit(email: string): Promise<RegisterInitResponse> {
  const normalizedEmail = email.toLowerCase().trim()

  const response = await fetch(`${API_BASE_URL}/v1/auth/register/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email: normalizedEmail }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Register init failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Registration step 2: complete registration using Firebase token + profile data
 */
export async function registerComplete(payload: RegisterCompleteRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/register/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Register complete failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Logout user
 */
export async function logout(): Promise<MessageResponse> {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (refreshToken) {
      console.log('🚪 Logging out user')
      
      const response = await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      })

      if (!response.ok) {
        console.warn('⚠️ Logout request failed, but clearing local storage anyway')
      } else {
        const data: MessageResponse = await response.json()
        console.log('✅ Logout successful:', data.message)
      }
    }
    
    // Clear local storage regardless of API response
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    
    return { message: 'Logged out successfully' }
  } catch (error) {
    console.error('💥 Logout error:', error)
    // Still clear local storage on error
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    throw error
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<TokenResponse> {
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token')
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available')
    }
    
    console.log('🔄 Refreshing access token')
    
    const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Token refresh failed:', errorText)
      // Clear invalid tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
    }

    const data: TokenResponse = await response.json()
    console.log('✅ Token refreshed successfully')
    
    // Update stored tokens
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    
    return data
  } catch (error) {
    console.error('💥 Token refresh error:', error)
    throw error
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const accessToken = localStorage.getItem('access_token')
    
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    console.log('👤 Getting current user info')
    
    const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        try {
          await refreshToken()
          // Retry the request with new token
          const newAccessToken = localStorage.getItem('access_token')
          const retryResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Accept': 'application/json',
            },
          })
          
          if (!retryResponse.ok) {
            throw new Error(`Failed to get user info after token refresh: ${retryResponse.status}`)
          }
          
          const data: AuthUser = await retryResponse.json()
          console.log('✅ Current user info retrieved (after token refresh):', data.email)
          return data
        } catch (refreshError) {
          console.error('❌ Token refresh failed during getCurrentUser:', refreshError)
          throw new Error('Authentication expired. Please login again.')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Get user info error:', errorText)
        throw new Error(`Failed to get user info: ${response.status} - ${errorText}`)
      }
    }

    const data: AuthUser = await response.json()
    console.log('✅ Current user info retrieved:', data.email)
    
    // Update stored user info
    localStorage.setItem('user', JSON.stringify(data))
    
    return data
  } catch (error) {
    console.error('💥 Get current user error:', error)
    throw error
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = localStorage.getItem('access_token')
  const user = localStorage.getItem('user')
  return !!(accessToken && user)
}

/**
 * Get stored user data
 */
export function getStoredUser(): AuthUser | null {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Error parsing stored user:', error)
    return null
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

/**
 * Make public API request (no authentication required)
 */
export async function publicRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    'Accept': 'application/json',
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  return response
}

/**
 * Make authenticated API request
 */
export async function authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
  })
  
  // If token expired, try to refresh and retry
  if (response.status === 401) {
    try {
      await refreshToken()
      const newAccessToken = getAccessToken()
      
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        },
      })
    } catch (refreshError) {
      console.error('Token refresh failed during authenticated request:', refreshError)
      throw new Error('Authentication expired. Please login again.')
    }
  }
  
  return response
}

/**
 * Check if email already exists in Firebase
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log('🔍 Checking if email exists:', email)

    await registerInit(email)
    console.log('✅ Email check result: AVAILABLE')
    return false
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      console.log('✅ Email check result: EXISTS')
      return true
    }
    console.error('💥 Email check error:', error)
    // En caso de error no relacionado a conflicto, no bloquear el registro
    return false
  }
}

/**
 * Update user role and national ID
 */
export interface UpdateRoleRequest {
  role: 'landlord' | 'agent'
  national_id: string
  national_id_type?: string
  agency_name?: string
}

export async function updateUserRole(roleData: UpdateRoleRequest): Promise<AuthUser> {
  try {
    console.log('🔄 Updating user role with data:', roleData)
    console.log('🌐 API URL:', `${API_BASE_URL}/v1/users/me`)
    
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Role update error response:', errorText)
      console.error('❌ Response status:', response.status)
      throw new Error(`Role update failed: ${response.status} - ${errorText}`)
    }

    const updatedUser: AuthUser = await response.json()
    console.log('✅ Role updated successfully!')
    console.log('👤 Updated user data:', updatedUser)
    console.log('🔐 New role:', updatedUser.role)
    
    // Update stored user info
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    return updatedUser
  } catch (error) {
    console.error('💥 Role update error:', error)
    throw error
  }
}

