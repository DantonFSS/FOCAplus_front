import { apiClient } from './index';

// DTOs para Period Instance
export interface PeriodInstanceResponse {
  id: string;
  userCourseId: string;
  periodTemplateId: string | null;
  name: string;
  position: number;
  plannedStart: string | null;
  plannedEnd: string | null;
}

export interface CreatePeriodInstanceRequest {
  userCourseId: string;
}

export interface UpdatePeriodInstanceRequest {
  name?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

export const periodInstancesApi = {
  create: async (data: CreatePeriodInstanceRequest): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.post<PeriodInstanceResponse>('/period-instances', data);
    return response.data;
  },

  getAll: async (): Promise<PeriodInstanceResponse[]> => {
    const response = await apiClient.get<PeriodInstanceResponse[]>('/period-instances');
    return response.data;
  },

  getByUserCourse: async (userCourseId: string): Promise<PeriodInstanceResponse[]> => {
    const response = await apiClient.get<PeriodInstanceResponse[]>(
      `/period-instances/by-user-course/${userCourseId}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.get<PeriodInstanceResponse>(`/period-instances/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdatePeriodInstanceRequest): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.put<PeriodInstanceResponse>(`/period-instances/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/period-instances/${id}`);
  },
};
