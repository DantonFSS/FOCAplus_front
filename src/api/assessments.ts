import { apiClient } from './index';

export interface AssessmentResponse {
  id: string;
  title: string;
  description: string;
  pointsPossible: number | null;
  date: string | null; // ISO string
  startTime: string | null; // "HH:mm:ss" ou "HH:mm"
  endTime: string | null;
  grade: number | null;
  disciplineInstanceId: string;
}

export interface CreateAssessmentRequest {
  disciplineInstanceId: string;
  title: string;
  description?: string;
  pointsPossible?: number;
  date?: string; // ISO
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
}

export interface UpdateAssessmentRequest {
  title?: string;
  description?: string;
  pointsPossible?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export const assessmentsApi = {
  create: async (data: CreateAssessmentRequest): Promise<AssessmentResponse> => {
    const response = await apiClient.post<AssessmentResponse>('/assessments', data);
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<AssessmentResponse[]> => {
    const response = await apiClient.get<AssessmentResponse[]>(
      `/assessments/by-discipline/${disciplineInstanceId}`,
    );
    return response.data;
  },

  getById: async (id: string): Promise<AssessmentResponse> => {
    const response = await apiClient.get<AssessmentResponse>(`/assessments/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateAssessmentRequest): Promise<AssessmentResponse> => {
    const response = await apiClient.put<AssessmentResponse>(`/assessments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assessments/${id}`);
  },
};


