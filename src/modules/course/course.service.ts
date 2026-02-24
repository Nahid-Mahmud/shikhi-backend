import { CourseStatus, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import {
  deleteFileByPublicId,
  deleteFileFormCloudinary,
  uploadFileToCloudinary,
} from '../../config/cloudinary.config';

import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';

import { generateSlug } from '../../utils';
import {
  CreateCoursePayload,
  GetCoursesFilters,
  UpdateCoursePayload,
} from './course.interface';

const createCourse = async (
  instructorId: string,
  payload: CreateCoursePayload,
  file?: Express.Multer.File
) => {
  const { title, description, price, isFree, status, categoryId } = payload;
  let thumbnail: string | undefined;
  let publicId: string | undefined; // Keep track for cleanup

  try {
    // 1. Validate Category early (Optional: Prisma connect handles this, but custom errors are nice)
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists)
        throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    // 2. Upload to Cloudinary
    if (file) {
      const uploadResult = await uploadFileToCloudinary(
        file,
        'course-thumbnails'
      );
      thumbnail = uploadResult.secure_url;
      publicId = uploadResult.public_id; // Store this for potential rollback
    }

    // 3. Create Course
    const course = await prisma.course.create({
      data: {
        title,
        slug: `${generateSlug(title)}-${Math.random().toString(36).substring(2, 7)}`,
        description,
        thumbnail,
        status: status ?? CourseStatus.draft,
        price: price ?? 0,
        isFree: isFree ?? (!price || price === 0),
        instructor: { connect: { id: instructorId } },
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
    });

    return course;
  } catch (error) {
    // 4. ROLLBACK: If DB fails, delete the uploaded image so you don't waste storage
    if (publicId) {
      await deleteFileByPublicId(publicId);
    }
    throw error; // Re-throw to your global error handler
  }
};

const updateCourse = async (
  courseId: string,
  payload: UpdateCoursePayload,
  file?: Express.Multer.File
) => {
  const { title, categoryId, ...otherData } = payload;

  // Check if course exists
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!existingCourse) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  // Validate category
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
    }
  }

  // Update thumbnail
  let thumbnail: string | undefined;
  if (file) {
    // Delete existing thumbnail if it exists
    if (existingCourse.thumbnail) {
      await deleteFileFormCloudinary(existingCourse.thumbnail);
    }
    // Upload new thumbnail
    const uploadResult = await uploadFileToCloudinary(
      file,
      'course-thumbnails'
    );
    thumbnail = uploadResult.secure_url;
  }

  // Handle title/slug change
  let slug: string | undefined;
  if (title) {
    slug = generateSlug(title);
  }

  // Build update data
  const updateData = {
    ...otherData,
    title,
    slug,
    thumbnail,
    ...(categoryId && { category: { connect: { id: categoryId } } }),
  };

  const course = await prisma.course.update({
    where: { id: courseId },
    data: updateData,
  });

  return course;
};

// public endpoint to get single course details by id (for course details page)
const getSingleCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  return course;
};

// get all course for public listing with filters, pagination and sorting

const getAllCourses = async (filters: GetCoursesFilters = {}) => {
  const {
    search,
    categoryId,
    category,
    instructorId,
    status,
    isFree,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  // 1. Sanitize Pagination inputs
  const take = Math.max(1, Number(limit));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  // 2. Construct the dynamic 'where' object
  const where: Prisma.CourseWhereInput = {
    isDeleted: false,
    // Logic: If search exists, look in title OR description
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    // Logic: Prefer specific categoryId over category name string
    ...(categoryId
      ? { categoryId }
      : category && {
          category: { name: { contains: category, mode: 'insensitive' } },
        }),
    ...(instructorId && { instructorId }),
    // status is already typed as CourseStatus so it can be used directly
    ...(status && { status }),
    ...(isFree !== undefined && { isFree: String(isFree) === 'true' }),
  };

  // 3. Execute queries in a transaction for data consistency
  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        isFree: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  // 4. Calculate metadata
  const totalPages = Math.ceil(total / take);

  return {
    data: courses,
    meta: {
      total,
      page: Number(page),
      limit: take,
      totalPages,
    },
  };
};

const deleteCourse = async (courseId: string) => {
  // Check if course exists
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
  });

  if (!existingCourse) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  // Soft delete the course
  await prisma.course.update({
    where: { id: courseId },
    data: { isDeleted: true },
  });
};

// get course details for student (includes only published courses and limited fields)

const getCourseDetailsForStudent = async (courseId: string, userId: string) => {
  // check if the student is enrolled in the course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You must be enrolled in this course to access its details'
    );
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.published, isDeleted: false },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          videoUrl: true,
          order: true,
          description: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Course not found or not published'
    );
  }

  return course;
};

// get course details for instructor/admin

const getCourseDetailsForInstructor = async (
  courseId: string,
  userId: string
) => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructorId: userId, // Ensure only the instructor or admins can access
      isDeleted: false,
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          videoUrl: true,
          order: true,
          description: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Course not found or you do not have permission to access it'
    );
  }

  return course;
};

const changeCourseStatus = async (courseId: string, status: CourseStatus) => {
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId, isDeleted: false },
  });

  if (!existingCourse) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: { status },
  });

  return course;
};

export const courseService = {
  createCourse,
  updateCourse,
  getSingleCourse,
  getAllCourses,
  deleteCourse,
  getCourseDetailsForStudent,
  getCourseDetailsForInstructor,
  changeCourseStatus,
};
