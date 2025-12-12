import { apiClient } from './index';

// DTOs
export interface ScoreRecordResponse {
  id: string;
  userId: string;
  userCourseId: string;
  disciplineInstanceId: string;
  sourceType: string;
  sourceId: string;
  points: number;
  createdAt: string;
}

export const scoresApi = {
  getMyScores: async (): Promise<ScoreRecordResponse[]> => {
    const response = await apiClient.get<ScoreRecordResponse[]>('/score-records/me');
    return response.data;
  },

  getByDiscipline: async (disciplineInstanceId: string): Promise<ScoreRecordResponse[]> => {
    const response = await apiClient.get<ScoreRecordResponse[]>(
      `/score-records/by-discipline/${disciplineInstanceId}`
    );
    return response.data;
  },

  getByUserCourse: async (userCourseId: string): Promise<ScoreRecordResponse[]> => {
    const response = await apiClient.get<ScoreRecordResponse[]>(
      `/score-records/by-course/${userCourseId}`
    );
    return response.data;
  },
};
