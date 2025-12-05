// API configuration and client setup
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Para web, pode ser necessário usar 127.0.0.1 ao invés de localhost
// ou configurar CORS no backend
export const API_BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });
    
    // Se erro 401, fazer logout
    if (error.response?.status === 401) {
      // Token inválido - limpar autenticação
      AsyncStorage.multiRemove([
        '@focaplus:accessToken',
        '@focaplus:refreshToken',
        '@focaplus:user',
      ]);
    }
    
    return Promise.reject(error);
  }
);

