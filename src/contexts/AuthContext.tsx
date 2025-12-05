import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse } from '../api/auth';
import { usersApi, UserResponse } from '../api/users';
import { apiClient } from '../api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (authData: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@focaplus:accessToken',
  REFRESH_TOKEN: '@focaplus:refreshToken',
  USER: '@focaplus:user',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Configurar token no apiClient
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
        
        // Se não tem user salvo, buscar do backend
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          await loadUser(storedAccessToken);
        }
        
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUser = async (token?: string) => {
    try {
      const tokenToUse = token || accessToken;
      const userData = await usersApi.getCurrentUser();
      setUser(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const login = async (authData: AuthResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken),
      ]);

      setAccessToken(authData.accessToken);
      setRefreshToken(authData.refreshToken);
      
      // Configurar token no apiClient
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authData.accessToken}`;
      
      // Buscar dados do usuário do backend
      await loadUser(authData.accessToken);
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);

      // Remover token do apiClient
      delete apiClient.defaults.headers.common['Authorization'];

      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        isLoading,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

