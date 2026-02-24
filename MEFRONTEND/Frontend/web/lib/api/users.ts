// API utilities for user management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Tipos de respuesta del API
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  bio?: string;
  role: 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN';
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  national_id?: string;
  national_id_type?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UpdateUserProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
}

/**
 * Helper para obtener el nombre completo
 */
export const getFullName = (profile: UserProfile): string => {
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sin nombre';
};
export interface UserPreferences {
  language?: string;
  currency?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  newsletter_subscribed?: boolean;
  marketing_emails?: boolean;
}

export interface PrivacySettings {
  profile_visibility?: 'public' | 'private' | 'contacts_only';
  show_email?: boolean;
  show_phone?: boolean;
  show_listings?: boolean;
  allow_messages?: boolean;
  allow_reviews?: boolean;
}

export interface AvatarUploadResponse {
  message: string;
  avatar_url: string;
}

/**
 * Helper para obtener el token de autenticación
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

/**
 * Helper para hacer requests autenticados
 */
const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response;
};

/**
 * Obtiene el perfil completo del usuario autenticado
 */
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await authenticatedFetch('/v1/users/me');
  return response.json();
};

/**
 * Actualiza el perfil del usuario autenticado
 */
export const updateUserProfile = async (
  data: UpdateUserProfileRequest
): Promise<UserProfile> => {
  const response = await authenticatedFetch('/v1/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

/**
 * Obtiene las preferencias del usuario
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const response = await authenticatedFetch('/v1/users/me/preferences');
  return response.json();
};

/**
 * Actualiza las preferencias del usuario
 */
export const updateUserPreferences = async (
  preferences: UserPreferences
): Promise<UserPreferences> => {
  const response = await authenticatedFetch('/v1/users/me/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
  return response.json();
};

/**
 * Obtiene la configuración de privacidad del usuario
 */
export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  const response = await authenticatedFetch('/v1/users/me/privacy');
  return response.json();
};

/**
 * Actualiza la configuración de privacidad del usuario
 */
export const updatePrivacySettings = async (
  settings: PrivacySettings
): Promise<PrivacySettings> => {
  const response = await authenticatedFetch('/v1/users/me/privacy', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return response.json();
};

/**
 * Sube un avatar para el usuario
 */
export const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_BASE_URL}/v1/users/me/avatar`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Elimina el avatar del usuario
 */
export const deleteAvatar = async (): Promise<{ message: string }> => {
  const response = await authenticatedFetch('/v1/users/me/avatar', {
    method: 'DELETE',
  });
  return response.json();
};

/**
 * Elimina la cuenta del usuario
 */
export const deleteAccount = async (reason?: string): Promise<{ message: string }> => {
  const response = await authenticatedFetch('/v1/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
  return response.json();
};
