import { prisma } from '../../config/prisma';
import { UserRole, EnrollmentStatus, PaymentStatus } from '@prisma/client';

const getOverallStats = async () => {
  const [
    totalCourses,
    totalRegisteredStudents,
    totalInstructors,
    totalRevenueResult,
    activeStudentsCount,
  ] = await Promise.all([
    prisma.course.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { role: UserRole.student } }),
    prisma.user.count({ where: { role: UserRole.instructor } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.succeeded },
    }),
    prisma.user.count({
      where: {
        role: UserRole.student,
        enrollments: { some: { status: EnrollmentStatus.active } },
      },
    }),
  ]);

  return {
    totalCourses,
    totalRegisteredStudents,
    totalInstructors,
    totalRevenue: totalRevenueResult._sum.amount || 0,
    totalActiveStudents: activeStudentsCount,
  };
};

const getEnrollmentGrowth = async () => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  tenDaysAgo.setHours(0, 0, 0, 0);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      createdAt: { gte: tenDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const growthMap: Record<string, number> = {};
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    growthMap[dateStr] = 0;
  }

  enrollments.forEach((enrollment) => {
    const dateStr = enrollment.createdAt.toISOString().split('T')[0];
    if (growthMap[dateStr] !== undefined) {
      growthMap[dateStr]++;
    }
  });

  return Object.entries(growthMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getTopCourses = async () => {
  const topCourses = await prisma.course.findMany({
    where: { isDeleted: false },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: {
      enrollments: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  return topCourses.map((course) => ({
    id: course.id,
    title: course.title,
    enrollments: course._count.enrollments,
  }));
};

const getRevenuePerCourse = async () => {
  const revenuePerCourse = await prisma.payment.groupBy({
    by: ['courseId'],
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.succeeded,
    },
  });

  const courseDetails = await prisma.course.findMany({
    where: {
      id: { in: revenuePerCourse.map((r) => r.courseId) },
    },
    select: {
      id: true,
      title: true,
    },
  });

  return revenuePerCourse.map((r) => {
    const course = courseDetails.find((c) => c.id === r.courseId);
    return {
      courseId: r.courseId,
      title: course?.title || 'Unknown',
      revenue: r._sum.amount || 0,
    };
  });
};

const getInstructorCompletionRates = async () => {
  const instructors = await prisma.user.findMany({
    where: { role: UserRole.instructor },
    include: {
      courses: {
        include: {
          enrollments: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  return instructors.map((instructor) => {
    let totalEnrollments = 0;
    let completedEnrollments = 0;

    instructor.courses.forEach((course) => {
      totalEnrollments += course.enrollments.length;
      completedEnrollments += course.enrollments.filter(
        (e) => e.status === EnrollmentStatus.completed
      ).length;
    });

    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    return {
      instructorId: instructor.id,
      name: instructor.name,
      completionRate: parseFloat(completionRate.toFixed(2)),
      totalEnrollments,
      completedEnrollments,
    };
  });
};

const getCoursesByCategory = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { courses: { where: { isDeleted: false } } },
      },
    },
  });

  return categories.map((category) => ({
    categoryId: category.id,
    name: category.name,
    courseCount: category._count.courses,
  }));
};

const getGlobalCompletionRate = async () => {
  const stats = await prisma.enrollment.aggregate({
    _avg: {
      progressPercentage: true,
    },
  });

  return {
    averageCompletionPercentage: parseFloat(
      (stats._avg.progressPercentage || 0).toFixed(2)
    ),
  };
};

export const statsService = {
  getOverallStats,
  getEnrollmentGrowth,
  getTopCourses,
  getRevenuePerCourse,
  getInstructorCompletionRates,
  getCoursesByCategory,
  getGlobalCompletionRate,
};
