import { apiClient } from './index';

// DTOs
export interface CreateDisciplineTeacherRequest {
  disciplineInstanceId: string;
  teacherName: string;
}

export interface UpdateDisciplineTeacherRequest {
  teacherName: string;
}

export interface DisciplineTeacherResponse {
  id: string;
  disciplineInstanceId: string;
  teacherName: string;
}

export const disciplineTeachersApi = {
  create: async (data: CreateDisciplineTeacherRequest): Promise<DisciplineTeacherResponse> => {
    const response = await apiClient.post<DisciplineTeacherResponse>('/discipline-teachers', data);
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<DisciplineTeacherResponse[]> => {
    const response = await apiClient.get<DisciplineTeacherResponse[]>(
      `/discipline-teachers/by-discipline/${disciplineInstanceId}`
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateDisciplineTeacherRequest
  ): Promise<DisciplineTeacherResponse> => {
    const response = await apiClient.put<DisciplineTeacherResponse>(`/discipline-teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discipline-teachers/${id}`);
  },
};

