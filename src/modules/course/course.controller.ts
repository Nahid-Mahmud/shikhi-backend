import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { courseService } from './course.service';
import { GetCoursesFilters } from './course.interface';
import { StatusCodes } from 'http-status-codes';

const createCourse = catchAsync(async (req, res) => {
  const instructorId = req.user.id;

  const course = await courseService.createCourse(
    instructorId,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Course created successfully',
    data: course,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const course = await courseService.updateCourse(
    id as string,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course updated successfully',
    data: course,
  });
});

// get single course

const getSingleCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const course = await courseService.getSingleCourse(id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course retrieved successfully',
    data: course,
  });
});

const getAllCourses = catchAsync(async (req, res) => {
  // query params contain filtering / pagination options
  const result = await courseService.getAllCourses(
    req.query as GetCoursesFilters
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Courses retrieved successfully',
    data: result.data,
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: result.meta.totalPages,
    },
  });
});

const deleteCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  await courseService.deleteCourse(id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course deleted successfully',
    data: null,
  });
});

const getCourseDetailsForStudent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const courseDetails = await courseService.getCourseDetailsForStudent(
    id as string,
    userId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course details retrieved successfully',
    data: courseDetails,
  });
});

const getCourseDetailsForInstructor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const courseDetails = await courseService.getCourseDetailsForInstructor(
    id as string,
    userId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course details retrieved successfully',
    data: courseDetails,
  });
});

const changeCourseStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const course = await courseService.changeCourseStatus(id as string, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course status updated successfully',
    data: course,
  });
});

const getCoursesForInstructor = catchAsync(async (req, res) => {
  const instructorId = req.user.id;
  const courses = await courseService.getCoursesForInstructor(instructorId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Courses retrieved successfully',
    data: courses,
  });
});

export const courseController = {
  createCourse,
  updateCourse,
  getAllCourses,
  getSingleCourse,
  deleteCourse,
  getCourseDetailsForStudent,
  getCourseDetailsForInstructor,
  changeCourseStatus,
  getCoursesForInstructor,
};
