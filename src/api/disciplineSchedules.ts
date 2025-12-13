import { apiClient } from './index';

export interface CreateDisciplineScheduleRequest {
  disciplineInstanceId: string;
  weekday: number; // 0=domingo, 1=segunda, ..., 6=sábado
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface UpdateDisciplineScheduleRequest {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface DisciplineScheduleResponse {
  id: string;
  disciplineInstanceId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export const disciplineSchedulesApi = {
  create: async (data: CreateDisciplineScheduleRequest): Promise<DisciplineScheduleResponse> => {
    const response = await apiClient.post<DisciplineScheduleResponse>('/discipline-schedules', data);
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<DisciplineScheduleResponse[]> => {
    const response = await apiClient.get<DisciplineScheduleResponse[]>(
      `/discipline-schedules/by-discipline/${disciplineInstanceId}`
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateDisciplineScheduleRequest
  ): Promise<DisciplineScheduleResponse> => {
    const response = await apiClient.put<DisciplineScheduleResponse>(`/discipline-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discipline-schedules/${id}`);
  },
};

