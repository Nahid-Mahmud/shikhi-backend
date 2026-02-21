import express from 'express';
import { UserRole } from '@prisma/client';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { enrollmentController } from './enrollment.controller';
import { enrollmentValidation } from './enrollment.validation';

const router = express.Router();

router.post(
  '/',
  checkAuth(UserRole.student),
  validateRequest(enrollmentValidation.create),
  enrollmentController.enrollStudent
);

router.get(
  '/my-courses',
  checkAuth(UserRole.student),
  enrollmentController.getMyEnrolledCourses
);

router.get(
  '/',
  checkAuth(UserRole.admin, UserRole.instructor),
  validateRequest(enrollmentValidation.list),
  enrollmentController.getCourseEnrollments
);

router.patch(
  '/:id/status',
  checkAuth(UserRole.admin, UserRole.instructor),
  validateRequest(enrollmentValidation.updateStatus),
  enrollmentController.updateEnrollmentStatus
);

export const enrollmentRoutes = router;
