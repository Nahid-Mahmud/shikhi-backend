import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { enrollmentService } from './enrollment.service';
import { GetEnrollmentsFilters } from './enrollment.interface';

const enrollStudent = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await enrollmentService.enrollStudent(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Enrolled in course successfully',
    data: result,
  });
});

const updateEnrollmentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await enrollmentService.updateEnrollmentStatus(
    id as string,
    status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrollment status updated successfully',
    data: result,
  });
});

const getMyEnrolledCourses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await enrollmentService.getMyEnrolledCourses(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Enrolled courses fetched successfully',
    data: result,
  });
});

const getCourseEnrollments = catchAsync(async (req, res) => {
  const result = await enrollmentService.getCourseEnrollments(
    req.query as GetEnrollmentsFilters
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Course enrollments fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const enrollmentController = {
  enrollStudent,
  updateEnrollmentStatus,
  getMyEnrolledCourses,
  getCourseEnrollments,
};
