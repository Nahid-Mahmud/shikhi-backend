import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import {
  uploadFileToCloudinary,
  deleteFileFormCloudinary,
} from '../../config/cloudinary.config';
import { ILesson, IUpdateLesson } from './lesson.interface';

const createLesson = async (
  payload: ILesson,
  videoFile?: Express.Multer.File
) => {
  const { courseId, ...lessonData } = payload;

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
  });

  if (!course) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  // upload video if provided (and override any provided videoUrl)
  let videoUrl: string | undefined = lessonData.videoUrl;

  try {
    if (videoFile) {
      const uploadResult = await uploadFileToCloudinary(
        videoFile,
        'lesson-videos'
      );
      videoUrl = uploadResult.secure_url;
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        ...(videoUrl && { videoUrl }),
        course: { connect: { id: courseId } },
      },
    });

    return lesson;
  } catch (error) {
    // rollback any uploaded video when db create fails
    if (videoUrl) {
      await deleteFileFormCloudinary(videoUrl);
    }
    throw error;
  }
};

const getAllLessons = async (courseId?: string) => {
  const lessons = await prisma.lesson.findMany({
    where: courseId ? { courseId } : {},
    orderBy: { order: 'asc' },
  });

  return lessons;
};

const getSingleLesson = async (id: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      course: true,
    },
  });

  if (!lesson) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
  }

  return lesson;
};

const updateLesson = async (
  id: string,
  payload: IUpdateLesson,
  videoFile?: Express.Multer.File
) => {
  const existingLesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!existingLesson) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
  }

  const { courseId, ...lessonData } = payload;
  const updateData: Prisma.LessonUpdateInput = { ...lessonData };

  if (courseId) {
    updateData.course = { connect: { id: courseId } };
  }

  const incomingType = payload.type ?? existingLesson.type;
  const typeChanged = payload.type && payload.type !== existingLesson.type;

  // Switching from video → text: delete the old Cloudinary video and clear videoUrl
  if (typeChanged && incomingType === 'text') {
    if (existingLesson.videoUrl) {
      await deleteFileFormCloudinary(existingLesson.videoUrl);
    }
    updateData.videoUrl = null;
  }

  // Switching from text → video: require a video file and clear text content
  if (typeChanged && incomingType === 'video') {
    if (!videoFile) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'A video file is required when switching lesson type to video'
      );
    }
    updateData.content = null;
  }

  // Upload new video file (either type switch to video, or replacing existing video)
  if (videoFile && incomingType === 'video') {
    // Delete old video only if we're replacing (not switching — already handled above)
    if (!typeChanged && existingLesson.videoUrl) {
      await deleteFileFormCloudinary(existingLesson.videoUrl);
    }

    const uploadResult = await uploadFileToCloudinary(
      videoFile,
      'lesson-videos'
    );
    updateData.videoUrl = uploadResult.secure_url;
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data: updateData,
  });

  return lesson;
};

const deleteLesson = async (id: string) => {
  const existingLesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!existingLesson) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
  }

  if (existingLesson.videoUrl) {
    await deleteFileFormCloudinary(existingLesson.videoUrl);
  }

  await prisma.lesson.delete({
    where: { id },
  });

  return null;
};

export const lessonService = {
  createLesson,
  getAllLessons,
  getSingleLesson,
  updateLesson,
  deleteLesson,
};
