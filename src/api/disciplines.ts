import { apiClient } from './index';

// DTOs
export interface CreateDisciplineTemplateRequest {
  periodTemplateId: string;
  name: string;
  notes?: string;
}

export interface BatchCreateDisciplineTemplateRequest {
  periodTemplateId: string;
  names: string[];
}

export interface UpdateDisciplineTemplateRequest {
  name?: string;
  notes?: string;
}

export interface DisciplineTemplateResponse {
  id: string;
  periodTemplateId: string;
  name: string;
  notes?: string;
}

export const disciplinesApi = {
  create: async (data: CreateDisciplineTemplateRequest): Promise<DisciplineTemplateResponse> => {
    const response = await apiClient.post<DisciplineTemplateResponse>('/discipline-templates', data);
    return response.data;
  },

  batchCreate: async (
    data: BatchCreateDisciplineTemplateRequest
  ): Promise<DisciplineTemplateResponse[]> => {
    const response = await apiClient.post<DisciplineTemplateResponse[]>(
      '/discipline-templates/batch',
      data
    );
    return response.data;
  },

  getAll: async (): Promise<DisciplineTemplateResponse[]> => {
    const response = await apiClient.get<DisciplineTemplateResponse[]>('/discipline-templates');
    return response.data;
  },

  getByPeriod: async (periodTemplateId: string): Promise<DisciplineTemplateResponse[]> => {
    const response = await apiClient.get<DisciplineTemplateResponse[]>(
      `/discipline-templates/by-period/${periodTemplateId}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<DisciplineTemplateResponse> => {
    const response = await apiClient.get<DisciplineTemplateResponse>(`/discipline-templates/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateDisciplineTemplateRequest
  ): Promise<DisciplineTemplateResponse> => {
    const response = await apiClient.put<DisciplineTemplateResponse>(`/discipline-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discipline-templates/${id}`);
  },
};

// Discipline Instance DTOs
export interface DisciplineInstanceResponse {
  id: string;
  userCourseId: string;
  disciplineTemplateId: string;
  periodInstanceId: string;
  plannedStart?: string;
  plannedEnd?: string;
  status?: string;
  grade?: number;
  gradeSystem?: string;
  assessmentsCount?: number;
  createdAt?: string;
  name: string;
  notes?: string;
}

export const disciplineInstancesApi = {
  getById: async (id: string): Promise<DisciplineInstanceResponse> => {
    const response = await apiClient.get<DisciplineInstanceResponse>(`/discipline-instances/${id}`);
    return response.data;
  },
};

