import { apiClient } from './index';

// DTOs
export interface CreatePeriodTemplateRequest {
  courseTemplateId: string;
}

export interface UpdatePeriodTemplateRequest {
  name?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

export interface PeriodTemplateResponse {
  id: string;
  courseTemplateId: string;
  name: string;
  position: number;
  plannedStart: string | null; 
  plannedEnd: string | null;
  archived?: boolean; // ✨ Adicionado
}

export const periodsApi = {
  // Period Templates
  createTemplate: async (data: CreatePeriodTemplateRequest): Promise<PeriodTemplateResponse> => {
    const response = await apiClient.post<PeriodTemplateResponse>('/period-templates', data);
    return response.data;
  },

  getTemplatesByCourse: async (courseTemplateId: string): Promise<PeriodTemplateResponse[]> => {
    const response = await apiClient.get<PeriodTemplateResponse[]>(
      `/period-templates/by-course/${courseTemplateId}`
    );
    return response.data;
  },

  getTemplateById: async (id: string): Promise<PeriodTemplateResponse> => {
    const response = await apiClient.get<PeriodTemplateResponse>(`/period-templates/${id}`);
    return response.data;
  },

  updateTemplate: async (
    id: string,
    data: UpdatePeriodTemplateRequest
  ): Promise<PeriodTemplateResponse> => {
    const response = await apiClient.put<PeriodTemplateResponse>(`/period-templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/period-templates/${id}`);
  },
};
