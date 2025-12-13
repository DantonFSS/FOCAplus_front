import { apiClient } from './index';

export interface DisciplineInstanceResponse {
  id: string;
  userCourseId: string;
  disciplineTemplateId: string;
  periodInstanceId: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  status: string;
  grade: number | null;
  gradeSystem: string;
  assessmentsCount: number | null;
  createdAt: string;
  name: string;
  notes: string | null;
}

export interface CreateDisciplineInstanceRequest {
  disciplineTemplateId: string;
  userCourseId: string;
  periodInstanceId: string;
  plannedStart?: string;
  plannedEnd?: string;
  assessmentsCount?: number;
}

export interface UpdateDisciplineInstanceRequest {
  plannedStart?: string;
  plannedEnd?: string;
  status?: string;
  grade?: number;
  gradeSystem?: string;
  assessmentsCount?: number;
}

export const disciplineInstancesApi = {
  create: async (data: CreateDisciplineInstanceRequest): Promise<DisciplineInstanceResponse> => {
    const response = await apiClient.post<DisciplineInstanceResponse>('/discipline-instances', data);
    return response.data;
  },

  getAll: async (): Promise<DisciplineInstanceResponse[]> => {
    const response = await apiClient.get<DisciplineInstanceResponse[]>('/discipline-instances');
    return response.data;
  },

  getByPeriodInstance: async (periodInstanceId: string): Promise<DisciplineInstanceResponse[]> => {
    const response = await apiClient.get<DisciplineInstanceResponse[]>(
      `/discipline-instances/by-period/${periodInstanceId}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<DisciplineInstanceResponse> => {
    const response = await apiClient.get<DisciplineInstanceResponse>(`/discipline-instances/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateDisciplineInstanceRequest): Promise<DisciplineInstanceResponse> => {
    const response = await apiClient.put<DisciplineInstanceResponse>(`/discipline-instances/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discipline-instances/${id}`);
  },
};
