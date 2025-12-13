import { apiClient } from './index';

export enum UserCourseRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export enum CourseLevel {
  UNDERGRADUATE = 'UNDERGRADUATE',
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  FREE_COURSE = 'FREE_COURSE',
  PROFESSIONAL = 'PROFESSIONAL',
  TECHNICAL = 'TECHNICAL',
}

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum DivisionType {
  PERIOD = 'PERIOD',
  SEMESTER = 'SEMESTER',
  YEAR = 'YEAR',
  MODULE = 'MODULE',
  PHASE = 'PHASE',
}

export interface UserCourseResponse {
  userCourseId: string;
  role: UserCourseRole;
  accepted: boolean;
  joinedAt: string;
  customStart: string | null;
  customEnd: string | null;

  templateId: string;
  name: string;
  level: CourseLevel;
  divisionType: DivisionType;
  divisionsCount: number;
  institutionName: string;
  startDate: string | null;
  endDate: string | null;
  address: string | null;
  online: boolean;
  status: CourseStatus;
  phones: string[];
  emails: string[];
  shareCode: string;
  createdBy: string;
  archived?: boolean;
}

export interface UpdateUserCourseRequest {
  customStart?: string;
  customEnd?: string;
  
  name?: string;
  level?: CourseLevel;
  divisionType?: DivisionType;
  divisionsCount?: number;
  institutionName?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  online?: boolean;
  status?: CourseStatus;
  phones?: string[];
  emails?: string[];
}

export interface JoinCourseRequest {
  shareCode: string;
}

export const userCoursesApi = {
  getAll: async (): Promise<UserCourseResponse[]> => {
    const response = await apiClient.get<UserCourseResponse[]>('/user-courses');
    return response.data;
  },

  getById: async (id: string): Promise<UserCourseResponse> => {
    const response = await apiClient.get<UserCourseResponse>(`/user-courses/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserCourseRequest): Promise<UserCourseResponse> => {
    const response = await apiClient.put<UserCourseResponse>(`/user-courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-courses/${id}`);
  },

  join: async (shareCode: string): Promise<UserCourseResponse> => {
    const response = await apiClient.post<UserCourseResponse>('/user-courses/join', { shareCode });
    return response.data;
  },
};
