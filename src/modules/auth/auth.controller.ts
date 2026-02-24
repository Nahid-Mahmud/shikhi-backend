import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { generateAuthTokens } from '../../utils/userTokens';
import { setAuthCookie } from '../../utils';
import { authService } from './auth.service';
import { StatusCodes } from 'http-status-codes';

const register = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const result = await authService.register(email, password, name, role);

  sendResponse(res, {
    success: true,
    message: 'User registered successfully',
    data: result,
    statusCode: StatusCodes.CREATED,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  const { accessToken, refreshToken } = generateAuthTokens({
    id: result.id,
    email: result.email,
    role: result.role,
  });

  setAuthCookie(res, {
    accessToken,
    refreshToken,
  });

  sendResponse(res, {
    success: true,
    message: 'User logged in successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgetPassword(email);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: StatusCodes.OK,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: StatusCodes.OK,
  });
});

const generateAccessTokenFromRefreshToken = catchAsync(async (req, res) => {
  const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
  const result =
    await authService.generateAccessTokenFromRefreshToken(tokenFromCookie);

  setAuthCookie(res, {
    accessToken: result.accessToken,
  });

  sendResponse(res, {
    success: true,
    message: 'Access token generated successfully',
    data: null,
    statusCode: StatusCodes.OK,
  });
});

const logout = catchAsync(async (_req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  sendResponse(res, {
    success: true,
    message: 'User logged out successfully',
    data: null,
    statusCode: StatusCodes.OK,
  });
});

export const authController = {
  register,
  login,
  forgetPassword,
  resetPassword,
  generateAccessTokenFromRefreshToken,
  logout,
};
