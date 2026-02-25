import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { lessonProgressValidation } from './lessonProgress.validation';
import { lessonProgressController } from './lessonProgress.controller';

const router = Router();

router.post(
  '/',
  checkAuth(UserRole.student),
  validateRequest(lessonProgressValidation.updateProgress),
  lessonProgressController.updateLessonProgress
);

router.patch(
  '/update',
  checkAuth(UserRole.student),
  validateRequest(lessonProgressValidation.updateProgress),
  lessonProgressController.updateLessonProgress
);

router.get(
  '/',
  checkAuth(UserRole.student),
  lessonProgressController.getMyProgress
);

router.get(
  '/:courseId',
  checkAuth(UserRole.student),
  lessonProgressController.getMyProgress
);

export const lessonProgressRoutes = router;
