import { apiClient } from './index';

export enum StudySessionType {
  ASSESSMENT = 'ASSESSMENT',
  HOMEWORK = 'HOMEWORK',
  LESSON = 'LESSON',
  CONTENT = 'CONTENT',
}

export enum StudySessionMode {
  POMODORO = 'POMODORO',
  STOPWATCH = 'STOPWATCH',
}

export interface CreateStudySessionDTO {
  userCourseId: string;
  disciplineInstanceId?: string;
  sessionType: StudySessionType;
  mode: StudySessionMode;
  durationSeconds: number;
  pomodoroCycles?: number;
  pointsEarned: number;
  startedAt: string;
  endedAt: string;
}

export interface StudySessionResponseDTO {
  id: string;
  userId: string;
  userCourseId: string;
  disciplineInstanceId?: string;
  sessionType: StudySessionType;
  mode: StudySessionMode;
  durationSeconds: number;
  pomodoroCycles: number;
  pointsEarned: number;
  startedAt: string;
  endedAt: string;
}

export const studySessionsApi = {
  create: async (data: CreateStudySessionDTO): Promise<StudySessionResponseDTO> => {
    const response = await apiClient.post<StudySessionResponseDTO>('/study-sessions', data);
    return response.data;
  },

  getAll: async (): Promise<StudySessionResponseDTO[]> => {
    const response = await apiClient.get<StudySessionResponseDTO[]>('/study-sessions');
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<StudySessionResponseDTO[]> => {
    const response = await apiClient.get<StudySessionResponseDTO[]>(
      `/study-sessions/by-discipline/${disciplineInstanceId}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<StudySessionResponseDTO> => {
    const response = await apiClient.get<StudySessionResponseDTO>(`/study-sessions/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/study-sessions/${id}`);
  },
};

