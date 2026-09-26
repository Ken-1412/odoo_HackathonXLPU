// ─── File Upload Middleware (Multer + Cloudinary) ────────────────────────────
import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';
import cloudinary from '../config/cloudinary';
import { Request } from 'express';
import fs from 'fs';

// Multer disk storage for temporary files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images
const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, GIF, WebP) are allowed', 400));
  }
};

// Document filter
const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed', 400));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Upload a local file to Cloudinary and return the URL.
 * Falls back to local path if Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  filePath: string,
  folder = 'assetflow'
): Promise<string> {
  try {
    // Check if Cloudinary is configured
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key) {
      // Return local path as fallback
      return `/uploads/${path.basename(filePath)}`;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    // Clean up local file
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // If Cloudinary fails, keep local file
    return `/uploads/${path.basename(filePath)}`;
  }
}
