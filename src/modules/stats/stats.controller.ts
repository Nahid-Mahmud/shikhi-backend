import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { statsService } from './stats.service';
import { StatusCodes } from 'http-status-codes';

const getOverallStats = catchAsync(async (req, res) => {
  const result = await statsService.getOverallStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Overall stats retrieved successfully',
    data: result,
  });
});

const getEnrollmentGrowth = catchAsync(async (req, res) => {
  const result = await statsService.getEnrollmentGrowth();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrollment growth retrieved successfully',
    data: result,
  });
});

const getTopCourses = catchAsync(async (req, res) => {
  const result = await statsService.getTopCourses();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Top courses retrieved successfully',
    data: result,
  });
});

const getRevenuePerCourse = catchAsync(async (req, res) => {
  const result = await statsService.getRevenuePerCourse();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Revenue per course retrieved successfully',
    data: result,
  });
});

const getInstructorCompletionRates = catchAsync(async (req, res) => {
  const result = await statsService.getInstructorCompletionRates();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Instructor completion rates retrieved successfully',
    data: result,
  });
});

const getCoursesByCategory = catchAsync(async (req, res) => {
  const result = await statsService.getCoursesByCategory();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Courses by category retrieved successfully',
    data: result,
  });
});

const getGlobalCompletionRate = catchAsync(async (req, res) => {
  const result = await statsService.getGlobalCompletionRate();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Global completion rate retrieved successfully',
    data: result,
  });
});

export const statsController = {
  getOverallStats,
  getEnrollmentGrowth,
  getTopCourses,
  getRevenuePerCourse,
  getInstructorCompletionRates,
  getCoursesByCategory,
  getGlobalCompletionRate,
};
