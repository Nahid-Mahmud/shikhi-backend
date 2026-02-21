import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { UserRole } from '@prisma/client';
import { statsController } from './stats.controller';

const router = Router();

// All stats routes are for admins and super admins only
router.use(checkAuth(UserRole.admin, UserRole.super_admin));

router.get('/overall', statsController.getOverallStats);
router.get('/enrollment-growth', statsController.getEnrollmentGrowth);
router.get('/top-courses', statsController.getTopCourses);
router.get('/revenue-per-course', statsController.getRevenuePerCourse);
router.get(
  '/instructor-completion-rates',
  statsController.getInstructorCompletionRates
);
router.get('/courses-by-category', statsController.getCoursesByCategory);
router.get('/global-completion-rate', statsController.getGlobalCompletionRate);

export const statsRoutes = router;
