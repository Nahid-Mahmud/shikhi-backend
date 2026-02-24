import bcrypt from 'bcryptjs';

import { StatusCodes } from 'http-status-codes';
import envVariables from '../../config/env';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { generateJwtToken, verifyJwtToken } from '../../utils/jwt';
import { createNewRefreshToken } from '../../utils/userTokens';
import { hashPassword } from '../../utils/hashPassword';
import { sendEmail } from '../../utils/sendEmail';

const register = async (
  email: string,
  password: string,
  name: string,
  role: 'student' | 'instructor' = 'student'
) => {
  if (!email || !password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  return user;
};

// !login user

const login = async (email: string, password: string) => {
  if (!email || !password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    omit: {
      password: false,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isMatchPassword = await bcrypt.compare(password, user.password);
  if (!isMatchPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: userPassword, ...rest } = user;

  return rest;
};

// ! forget password

const forgetPassword = async (email: string) => {
  if (!email || !email.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return generic message, do not leak user existence
  if (!user) {
    return {
      message: 'If your email exists, a password reset link has been sent.',
    };
  }

  const jwtSecret = envVariables.JWT.FORGET_PASSWORD_TOKEN_JWT_SECRET;
  const expiresIn = envVariables.JWT.FORGET_PASSWORD_TOKEN_JWT_EXPIRATION;
  if (!jwtSecret || !expiresIn) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Server configuration error'
    );
  }

  const resetToken = generateJwtToken(
    { email: user.email, id: user.id },
    jwtSecret,
    expiresIn
  );

  // Build reset link
  const resetLink = `${envVariables.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send email
  await sendEmail({
    subject: 'Password Reset Request',
    to: user.email,
    templateName: 'forgotPassword.ejs',
    templateData: {
      userName: user.name || user.email,
      resetUrl: resetLink,
    },
  });

  return {
    message: 'If your email exists, a password reset link has been sent.',
  };
};

const resetPassword = async (token: string, newPassword: string) => {
  const jwtSecret = envVariables.JWT.FORGET_PASSWORD_TOKEN_JWT_SECRET;

  let decoded: { email: string; id: string };
  try {
    decoded = verifyJwtToken(token, jwtSecret) as { email: string; id: string };
  } catch {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid or expired reset token'
    );
  }

  if (!decoded.email || !decoded.id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token payload');
  }

  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user || user.id !== decoded.id) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'User not found or token mismatch'
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12); // Increased salt rounds for better security

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { message: 'Password reset successful' };
};

const generateAccessTokenFromRefreshToken = async (
  refreshTokenValue?: string
) => {
  if (!refreshTokenValue) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token is required');
  }

  const accessToken = await createNewRefreshToken(refreshTokenValue);

  return { accessToken };
};

export const authService = {
  register,
  login,
  forgetPassword,
  resetPassword,
  generateAccessTokenFromRefreshToken,
};
