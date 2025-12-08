import { apiClient } from './index';

// DTOs
export interface CreatePeriodTemplateRequest {
  courseTemplateId: string;
  periodNumber: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface UpdatePeriodTemplateRequest {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface PeriodTemplateResponse {
  id: string;
  name: string;
  position: number;        
  plannedStart: string;   
  plannedEnd: string;     
}

export interface CreatePeriodInstanceRequest {
  userCourseId: string;
  periodTemplateId: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface UpdatePeriodInstanceRequest {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface PeriodInstanceResponse {
  id: string;
  userCourseId: string;
  periodTemplateId: string;
  startDate?: string;
  endDate?: string;
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

  // Period Instances
  createInstance: async (data: CreatePeriodInstanceRequest): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.post<PeriodInstanceResponse>('/period-instances', data);
    return response.data;
  },

  getInstancesByUserCourse: async (userCourseId: string): Promise<PeriodInstanceResponse[]> => {
    const response = await apiClient.get<PeriodInstanceResponse[]>(
      `/period-instances/by-user-course/${userCourseId}`
    );
    return response.data;
  },

  getInstanceById: async (id: string): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.get<PeriodInstanceResponse>(`/period-instances/${id}`);
    return response.data;
  },

  updateInstance: async (
    id: string,
    data: UpdatePeriodInstanceRequest
  ): Promise<PeriodInstanceResponse> => {
    const response = await apiClient.put<PeriodInstanceResponse>(`/period-instances/${id}`, data);
    return response.data;
  },

  deleteInstance: async (id: string): Promise<void> => {
    await apiClient.delete(`/period-instances/${id}`);
  },
};

