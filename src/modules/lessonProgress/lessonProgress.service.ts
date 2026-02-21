import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';

import { EnrollmentStatus } from '@prisma/client';

const updateLessonProgress = async (
  userId: string,
  lessonId: string,
  isCompleted: boolean
) => {
  // 1. Find the lesson and its course
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });

  if (!lesson) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
  }

  // 2. Find the enrollment for this user and course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId: lesson.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not enrolled in this course'
    );
  }

  // 3. Upsert progress
  await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    update: {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // 4. Calculate progress percentage
  const totalLessons = await prisma.lesson.count({
    where: { courseId: lesson.courseId },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      enrollmentId: enrollment.id,
      isCompleted: true,
    },
  });

  const progressPercentage =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // 5. Update enrollment with progress and status
  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercentage,
      status:
        progressPercentage === 100
          ? EnrollmentStatus.completed
          : EnrollmentStatus.active,
    },
  });

  return updatedEnrollment;
};

const getMyProgress = async (userId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId,
      },
    },
    include: {
      progress: {
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not enrolled in this course'
    );
  }

  return enrollment.progress;
};

export const lessonProgressService = {
  updateLessonProgress,
  getMyProgress,
};
