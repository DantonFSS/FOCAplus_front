import { apiClient } from './index';

// Enums do backend
export enum CourseLevel {
  UNDERGRADUATE = 'UNDERGRADUATE',
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  FREE_COURSE = 'FREE_COURSE',
  PROFESSIONAL = 'PROFESSIONAL',
  TECHNICAL = 'TECHNICAL',
}

export enum DivisionType {
  SEMESTER = 'SEMESTER',
  PERIOD = 'PERIOD',
  YEAR = 'YEAR',
  MODULE = 'MODULE',
  QUARTER = 'QUARTER',
}

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

// Mapeamento do frontend para backend
export const mapLevelToBackend = (level: string): CourseLevel => {
  const mapping: { [key: string]: CourseLevel } = {
    'graduacao': CourseLevel.UNDERGRADUATE,
    'pos-graduacao': CourseLevel.PROFESSIONAL,
    'mestrado': CourseLevel.MASTER,
    'doutorado': CourseLevel.DOCTORATE,
    'tecnico': CourseLevel.TECHNICAL,
  };
  return mapping[level] || CourseLevel.UNDERGRADUATE;
};

export const mapDivisionTypeToBackend = (type: string): DivisionType => {
  const mapping: { [key: string]: DivisionType } = {
    'semestres': DivisionType.SEMESTER,
    'anos': DivisionType.YEAR,
    'periodos': DivisionType.PERIOD,
  };
  return mapping[type] || DivisionType.PERIOD;
};

// DTOs
export interface CreateCourseRequest {
  name: string;
  level: CourseLevel;
  divisionType: DivisionType;
  divisionsCount: number;
  institutionName?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  address?: string;
  online?: boolean;
  status?: CourseStatus;
  phones?: string[];
  emails?: string[];
}

export interface CourseResponse {
  id: string;
  name: string;
  level: CourseLevel;
  divisionType: DivisionType;
  divisionsCount: number;
  institutionName?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  online: boolean;
  status: CourseStatus;
  phones?: string[];
  emails?: string[];
  shareCode?: string;
  createdBy?: string;
}

export interface UpdateCourseRequest {
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

export const coursesApi = {
  create: async (data: CreateCourseRequest): Promise<CourseResponse> => {
    const response = await apiClient.post<CourseResponse>('/courses', data);
    return response.data;
  },

  getAll: async (): Promise<CourseResponse[]> => {
    const response = await apiClient.get<CourseResponse[]>('/courses');
    return response.data;
  },

  getById: async (id: string): Promise<CourseResponse> => {
    const response = await apiClient.get<CourseResponse>(`/courses/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateCourseRequest): Promise<CourseResponse> => {
    const response = await apiClient.put<CourseResponse>(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },
};

