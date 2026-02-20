import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import { storageService } from '@/services/storage/storageService';
import { authApi } from '@/services/api/authApi';

interface UseAuthResult {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Intentar obtener usuario del storage
        const storedUser = await storageService.getUser();
        if (storedUser) {
          setUser(storedUser);
          
          // Intentar refrescar datos del usuario desde el servidor
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Error refreshing user:', error);
            // Mantener el usuario del storage si falla
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      await storageService.saveUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      await storageService.removeUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Limpiar local aunque falle el servidor
      setUser(null);
      await storageService.removeUser();
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      await storageService.saveUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  return {
    user,
    isLoggedIn: user !== null,
    isLoading,
    login,
    logout,
    refreshUser,
  };
};
