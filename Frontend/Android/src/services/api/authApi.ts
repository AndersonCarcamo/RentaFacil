import { apiService } from './apiService';
import { User, LoginCredentials, RegisterData, AuthTokens } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';
import { auth } from '@/config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  token_type: string;
  expires_in: number;
}

interface RegisterResponse {
  user: User;
  message: string;
}

export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Logging in with Firebase:', credentials.email);
      
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase login successful');
      
      // 2. Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      console.log('🎫 Got Firebase ID token');
      
      // 3. Login to our backend with Firebase token
      const response = await apiService.post<LoginResponse>('/auth/login', {
        firebase_token: idToken
      });
      
      // Guardar tokens en AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      
      console.log('✅ Backend login successful');
      console.log('👤 User data:', response.user);
      
      return response;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      // Handle Firebase-specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            throw new Error('Usuario no encontrado. ¿Necesitas registrarte?');
          case 'auth/wrong-password':
            throw new Error('Contraseña incorrecta');
          case 'auth/invalid-email':
            throw new Error('Email inválido');
          case 'auth/user-disabled':
            throw new Error('Esta cuenta ha sido deshabilitada');
          case 'auth/too-many-requests':
            throw new Error('Demasiados intentos fallidos. Intenta más tarde');
          default:
            throw new Error('Error al iniciar sesión. Por favor, inténtalo de nuevo');
        }
      }
      
      throw error;
    }
  },

  // Register
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      console.log('📝 Registering with Firebase:', data.email);
      
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase user created');
      
      // 2. Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // 3. Register in our backend
      const registerPayload = {
        email: data.email,
        firebase_uid: firebaseUser.uid,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        national_id: data.nationalId,
        national_id_type: data.nationalIdType,
        role: data.role,
        accept_terms: data.acceptTerms,
        accept_privacy: data.acceptPrivacy,
        agency_name: data.agencyName,
        agency_ruc: data.agencyRuc,
      };

      const response = await apiService.post<RegisterResponse>('/auth/register', registerPayload);
      
      console.log('✅ Backend registration successful');
      
      // Si hay foto de perfil, guardarla para subirla después del login
      if (data.profilePicture) {
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_AVATAR, JSON.stringify(data.profilePicture));
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      // Handle Firebase-specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('Este email ya está registrado');
          case 'auth/invalid-email':
            throw new Error('Email inválido');
          case 'auth/weak-password':
            throw new Error('La contraseña es muy débil');
          default:
            throw new Error('Error al registrar. Por favor, inténtalo de nuevo');
        }
      }
      
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      // Logout from Firebase
      await firebaseSignOut(auth);
      
      // Logout from backend
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Error al hacer logout:', error);
    } finally {
      // Limpiar storage local
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    }
  },

  // Verificar si el email existe
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ exists: boolean }>('/auth/check-email', { email });
      return response.exists;
    } catch (error) {
      console.error('Error al verificar email:', error);
      return false;
    }
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<{ user: User }>('/auth/me');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      return response.user;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<AuthTokens>('/auth/refresh', { refreshToken });
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      
      return response;
    } catch (error) {
      throw error;
    }
  },
};
