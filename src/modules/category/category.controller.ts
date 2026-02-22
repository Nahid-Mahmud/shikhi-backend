import { Request, Response } from 'express';
import { categoryService } from './category.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

export const createCategory = async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Category created successfully',
    data: category,
  });
};

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
};

export const getCategoryById = async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(
    req.params.id as string
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(
    req.params.id as string,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
};

export const deleteCategory = async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category deleted successfully',
    data: null,
  });
};
