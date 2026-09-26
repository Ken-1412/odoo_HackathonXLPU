// ─── Standardized API Response Utilities ────────────────────────────────────
import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, any>
): void {
  const response: SuccessResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: any
): void {
  const response: ErrorResponse = { success: false, message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
