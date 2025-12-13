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
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const response = await apiClient.get<UserResponse>('/users/me');
      return response.data;
    } catch (error) {
      throw new Error('Usuário não encontrado');
    }
  },

  getById: async (userId: string): Promise<UserResponse> => {
    try {
      const response = await apiClient.get<UserResponse>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Usuário não encontrado');
    }
  },
};

