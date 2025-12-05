import { apiClient } from './index';

export interface UserResponse {
  id: string;
  name: string;
  username: string;
  email: string;
  cpf?: string;
  phone?: string;
  userRegisterDate?: string;
}

export const usersApi = {
  /**
   * Busca o usuário atual autenticado usando o endpoint /me
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const response = await apiClient.get<UserResponse>('/users/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      throw new Error('Usuário não encontrado');
    }
  },

  /**
   * Busca um usuário específico por ID
   */
  getById: async (userId: string): Promise<UserResponse> => {
    try {
      const response = await apiClient.get<UserResponse>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Usuário não encontrado');
    }
  },
};

