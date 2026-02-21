import { PaymentStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import envVariables from '../../config/env';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { stripe } from '../../utils/stripe';

const createCheckoutSession = async (userId: string, courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  // check if the user is the instructor of the course
  if (course.instructorId === userId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Instructors cannot enroll in their own courses'
    );
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'You are already enrolled in this course'
    );
  }

  // If course is free, enroll directly
  if (course.isFree) {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: userId,
        courseId: courseId,
      },
    });

    return {
      enrolled: true,
      message: 'Successfully enrolled in free course',
      enrollment,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description || undefined,
          },
          unit_amount: Math.round(course.price * 100), // Stripe expects amounts in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${envVariables.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVariables.FRONTEND_URL}/course/${course.id}`,
    customer_email: (await prisma.user.findUnique({ where: { id: userId } }))
      ?.email,
    metadata: {
      userId,
      courseId,
    },
  });

  return {
    url: session.url,
    message: 'Checkout session created successfully',
  };
};

const confirmPayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Payment not completed');
  }

  if (!session.metadata) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid session metadata');
  }

  const { userId, courseId } = session.metadata;

  if (!userId || !courseId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid session metadata');
  }

  // Check if already enrolled (to avoid duplicate enrollment)
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    return { message: 'Already enrolled' };
  }

  const amountTotal = session.amount_total;
  const currency = session.currency;

  if (amountTotal === null || currency === null) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid session data');
  }

  await prisma.$transaction(async (tx) => {
    // 1. Create Payment record
    await tx.payment.create({
      data: {
        userId,
        courseId,
        amount: amountTotal / 100,
        currency: currency,
        status: PaymentStatus.succeeded,
        stripePaymentId: session.payment_intent as string,
        stripeSessionId: session.id,
      },
    });

    // 2. Create Enrollment
    await tx.enrollment.create({
      data: {
        studentId: userId,
        courseId: courseId,
      },
    });
  });

  return { success: true };
};

export const paymentService = {
  createCheckoutSession,
  confirmPayment,
};
