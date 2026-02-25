import { z } from 'zod';

const updateProgress = z.object({
  body: z
    .object({
      lessonId: z.string().uuid('Invalid lesson ID'),
      isCompleted: z.boolean().optional(),
      completed: z.boolean().optional(),
    })
    .refine(
      (data) => data.isCompleted !== undefined || data.completed !== undefined,
      {
        message: 'Either isCompleted or completed must be provided',
      }
    ),
});

export const lessonProgressValidation = {
  updateProgress,
};
