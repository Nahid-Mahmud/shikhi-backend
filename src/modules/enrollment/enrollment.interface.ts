import { EnrollmentStatus } from '@prisma/client';

export interface CreateEnrollmentPayload {
  courseId: string;
}

export interface UpdateEnrollmentStatusPayload {
  status: EnrollmentStatus;
}

export interface GetEnrollmentsFilters {
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
