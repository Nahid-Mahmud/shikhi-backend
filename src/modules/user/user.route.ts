import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { userController } from './user.controller';
import { userValidation } from './user.validation';

const router = Router();

router.get('/me', checkAuth(...Object.values(UserRole)), userController.getMe);

router.get(
  '/',
  checkAuth(UserRole.admin, UserRole.super_admin),
  userController.getAllUsers
);

router.get(
  '/:id',
  checkAuth(UserRole.admin, UserRole.super_admin),
  userController.getUserById
);

router.patch(
  '/:id/status',
  checkAuth(UserRole.admin, UserRole.super_admin),
  validateRequest(userValidation.updateStatusSchema),
  userController.updateUserStatus
);

router.delete(
  '/:id',
  checkAuth(UserRole.super_admin),
  userController.deleteUser
);

router.patch(
  '/self/:id',
  checkAuth(...Object.values(UserRole)),
  validateRequest(userValidation.updateUserSchema),
  userController.updateUser
);

// Super Admin only — update an existing admin's data
router.patch(
  '/admin/:id',
  checkAuth(UserRole.super_admin),
  validateRequest(userValidation.updateAdminSchema),
  userController.updateAdmin
);

// Super Admin only — separate route to update user role
router.patch(
  '/:id/role',
  checkAuth(UserRole.super_admin),
  validateRequest(userValidation.updateRoleSchema),
  userController.updateUserRole
);

export const userRoutes = router;
