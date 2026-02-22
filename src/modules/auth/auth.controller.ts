import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { generateAuthTokens } from '../../utils/userTokens';
import { setAuthCookie } from '../../utils';
import { authService } from './auth.service';

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const result = await authService.register(email, password, name);

  sendResponse(res, {
    success: true,
    message: 'User registered successfully',
    data: result,
    statusCode: 201,
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
    statusCode: 200,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgetPassword(email);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: 200,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: 200,
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
    statusCode: 200,
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
    statusCode: 200,
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
