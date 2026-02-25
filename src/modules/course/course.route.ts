import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { multerUpload } from '../../config/multer.config';
import { courseValidation } from './course.validation';
import { courseController } from './course.controller';

const router = Router();

// public listing endpoint
router.get(
  '/',
  validateRequest(courseValidation.list),
  courseController.getAllCourses
);

router.get(
  '/instructors',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  courseController.getCoursesForInstructor
);

// get single course details - public endpoint
router.get('/:id', courseController.getSingleCourse);

router.post(
  '/',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  multerUpload.single('thumbnail'),
  validateRequest(courseValidation.create),
  courseController.createCourse
);

router.patch(
  '/:id',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  multerUpload.single('thumbnail'),
  validateRequest(courseValidation.update),
  courseController.updateCourse
);

// delete course by id
router.delete(
  '/:id',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  courseController.deleteCourse
);

// change course status
router.patch(
  '/:id/status',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  validateRequest(courseValidation.statusChange),
  courseController.changeCourseStatus
);

// get full course and related lessons by id for students

router.get(
  '/students/:id',
  checkAuth(UserRole.student, UserRole.admin, UserRole.super_admin),
  courseController.getCourseDetailsForStudent
);

// get full course and related lessons by id for instructors/admins

router.get(
  '/instructors/:id',
  checkAuth(UserRole.instructor, UserRole.admin, UserRole.super_admin),
  courseController.getCourseDetailsForInstructor
);

export default router;
