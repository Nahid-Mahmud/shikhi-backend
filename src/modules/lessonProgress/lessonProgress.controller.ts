import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { lessonProgressService } from './lessonProgress.service';

const updateLessonProgress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { lessonId, isCompleted, completed } = req.body;

  // Map 'completed' to 'isCompleted' if provided by frontend
  const finalIsCompleted = isCompleted !== undefined ? isCompleted : completed;

  const result = await lessonProgressService.updateLessonProgress(
    userId,
    lessonId,
    finalIsCompleted
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Lesson progress updated successfully',
    data: result,
  });
});

const getMyProgress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { courseId } = req.params;
  const { courseId: queryCourseId } = req.query;

  const result = await lessonProgressService.getMyProgress(
    userId,
    (courseId || queryCourseId) as string
  );

  // Map database response to frontend format (isCompleted -> completed)
  const formattedResult = result.map((p) => ({
    ...p,
    completed: p.isCompleted,
  }));

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Lesson progress fetched successfully',
    data: formattedResult,
  });
});

export const lessonProgressController = {
  updateLessonProgress,
  getMyProgress,
};
