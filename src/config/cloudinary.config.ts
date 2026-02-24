import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StatusCodes } from 'http-status-codes';

import crypto from 'crypto';
import stream from 'stream';
import AppError from '../errors/AppError';
import envVariables from './env';

cloudinary.config({
  cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const deleteFileFormCloudinary = async (url: string) => {
  if (!url || typeof url !== 'string') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'File URL is required and must be a string'
    );
  }

  // Skip deletion if it's a YouTube URL
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return; // Exit early for YouTube URLs
  }

  // regex to extract public ID and file extension from the URL
  const regex =
    /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|pdf|doc|docx)$/i;

  const match = url.match(regex);

  // check if match is not found
  if (!match || !match[1]) {
    throw new AppError(StatusCodes.BAD_GATEWAY, 'Invalid Cloudinary URL');
  }

  // match[1] contains the public ID, match[2] contains the file extension
  const publicId = match[1];
  const fileExtension = match[2].toLowerCase();

  // Determine resource type based on file extension
  let resourceType: 'image' | 'video' | 'raw' = 'raw';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];

  if (imageExtensions.includes(fileExtension)) {
    resourceType = 'image';
  } else if (videoExtensions.includes(fileExtension)) {
    resourceType = 'video';
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    // Check if deletion was successful
    if (res.result !== 'ok' && res.result !== 'not found') {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to delete file: ${res.result}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// Delete file from Cloudinary using public_id directly
export const deleteFileByPublicId = async (publicId: string) => {
  if (!publicId || typeof publicId !== 'string') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Public ID is required and must be a string'
    );
  }

  // Extract file extension from public_id to determine resource type
  const fileExtension = publicId.split('.').pop()?.toLowerCase() || '';

  let resourceType: 'image' | 'video' | 'raw' = 'raw';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];

  if (imageExtensions.includes(fileExtension)) {
    resourceType = 'image';
  } else if (videoExtensions.includes(fileExtension)) {
    resourceType = 'video';
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    // Check if deletion was successful
    if (res.result !== 'ok' && res.result !== 'not found') {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to delete file: ${res.result}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// for invoice upload or any other pdf upload
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const public_id = `pdf/${fileName}-${Date.now()}-${crypto.randomBytes(12).toString('hex')}`;
      const bufferStream = new stream.PassThrough();

      bufferStream.end(buffer);

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            public_id,
            folder: 'pdf',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(buffer);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to upload image to Cloudinary. ${error.message}`
    );
  }
};

// Generic file upload function for images, videos, and documents
export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<UploadApiResponse> => {
  try {
    return new Promise((resolve, reject) => {
      // Sanitize the original file name
      const sanitizedFileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/[^a-z0-9.-]/g, ''); // remove special characters except dots and hyphens

      // Get the current file extension
      const fileExtension = file.originalname.split('.').pop() || '';

      // Create unique file name
      const uniqueFileName =
        Math.random().toString(36).substring(2) +
        '-' +
        Date.now() +
        '-' +
        sanitizedFileName.replace(/\./g, '-') +
        '.' +
        fileExtension;

      // Determine resource type based on mimetype
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      }

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: resourceType,
            public_id: `${folder}/${uniqueFileName}`,
            folder: `skhkhi/${folder}`,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed - no result returned'));
            }
          }
        )
        .end(file.buffer);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to upload file to Cloudinary. ${error.message}`
    );
  }
};

export const cloudinaryUpload = cloudinary;
