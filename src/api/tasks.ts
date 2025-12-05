import { apiClient } from './index';

export interface TaskResponse {
  id: string;
  disciplineInstanceId: string;
  title: string;
  description: string | null;
  pointsPossible: number | null;
  dueDate: string | null; // ISO string
  createdAt: string | null;
  completed: boolean;
  completedAt: string | null;
}

export interface CreateTaskRequest {
  disciplineInstanceId: string;
  title: string;
  description?: string;
  pointsPossible?: number;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  pointsPossible?: number;
  dueDate?: string;
}

export interface CompleteTaskRequest {
  completed: boolean;
}

export interface CompleteTaskResponse {
  task: TaskResponse;
}

export const tasksApi = {
  create: async (data: CreateTaskRequest): Promise<TaskResponse> => {
    const response = await apiClient.post<TaskResponse>('/tasks', data);
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<TaskResponse[]> => {
    const response = await apiClient.get<TaskResponse[]>(`/tasks/by-discipline/${disciplineInstanceId}`);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskRequest): Promise<TaskResponse> => {
    const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, data);
    return response.data;
  },

  toggleComplete: async (id: string, completed: boolean): Promise<CompleteTaskResponse> => {
    const response = await apiClient.put<CompleteTaskResponse>(`/tasks/complete/${id}`, {
      completed,
    } as CompleteTaskRequest);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};


