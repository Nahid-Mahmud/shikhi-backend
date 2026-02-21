import { CourseStatus, EnrollmentStatus, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import {
  CreateEnrollmentPayload,
  GetEnrollmentsFilters,
} from './enrollment.interface';

const enrollStudent = async (
  studentId: string,
  payload: CreateEnrollmentPayload
) => {
  const { courseId } = payload;

  // 1. Check if course exists and is published
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  if (course.status !== CourseStatus.published) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Course is not available for enrollment'
    );
  }

  // 2. Check for duplicate enrollment
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'You are already enrolled in this course'
    );
  }

  // 3. Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
      status: EnrollmentStatus.active,
    },
    include: {
      course: true,
    },
  });

  return enrollment;
};

const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: EnrollmentStatus
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Enrollment not found');
  }

  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status },
  });

  return updatedEnrollment;
};

const getMyEnrolledCourses = async (studentId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          instructor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return enrollments;
};

const getCourseEnrollments = async (filters: GetEnrollmentsFilters) => {
  const {
    courseId,
    studentId,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const take = Math.max(1, Number(limit));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where: Prisma.EnrollmentWhereInput = {
    ...(courseId && { courseId }),
    ...(studentId && { studentId }),
    ...(status && { status }),
  };

  const [enrollments, total] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    data: enrollments,
    meta: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const enrollmentService = {
  enrollStudent,
  updateEnrollmentStatus,
  getMyEnrolledCourses,
  getCourseEnrollments,
};
