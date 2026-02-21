import { Router } from 'express';

import { authRoutes } from '../modules/auth/auth.route';
import { userRoutes } from '../modules/user/user.route';
import categoryRoutes from '../modules/category/category.route';
import courseRoutes from '../modules/course/course.route';
import { lessonRoutes } from '../modules/lesson/lesson.route';
import { lessonProgressRoutes } from '../modules/lessonProgress/lessonProgress.route';
import { paymentRoutes } from '../modules/payment/payment.route';
import { enrollmentRoutes } from '../modules/enrollment/enrollment.route';

export const router: Router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  { path: '/categories', route: categoryRoutes },
  { path: '/courses', route: courseRoutes },
  { path: '/lessons', route: lessonRoutes },
  { path: '/lesson-progress', route: lessonProgressRoutes },
  { path: '/payments', route: paymentRoutes },
  { path: '/enrollments', route: enrollmentRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
