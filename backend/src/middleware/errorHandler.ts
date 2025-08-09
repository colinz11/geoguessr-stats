import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(error.errors).map(err => err.message).join(', ');
  }

  // Mongoose cast error (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Don't expose stack traces in production
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
