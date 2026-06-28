import httpStatus from 'http-status';
import { ValidationError } from 'yup';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';
import ApiError from '../utils/apiError.js';

const multerErrorMessage = (err) => {
  if (err?.message === 'unsupported_file_type') return 'unsupported_file_type';
  if (err?.code === 'LIMIT_FILE_SIZE') return 'file_too_large';
  if (err?.code === 'LIMIT_FILE_COUNT') return 'too_many_files';
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') return 'unexpected_file';
  if (err?.code && String(err.code).startsWith('LIMIT_')) return 'invalid_file_upload';
  return '';
};

const multerErrorStatus = (err) => (err?.code === 'LIMIT_FILE_SIZE' ? 413 : 400);

const handler = (err, req, res, next) => {
  const response = {
    statusCode: err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    message: err.message || httpStatus[500],
    type: err.type,
    uuid: err.uuid,
  };
  if (!response.uuid) delete response.uuid;

  res.status(response.statusCode).json(response);
};

const converter = (err, req, res, next) => {
  let convertedError = err;
  if (err instanceof ValidationError) {
    convertedError = new ApiError(
      httpStatus.BAD_REQUEST,
      err?.errors?.join(', ') || 'Validations have failed',
      'Validation Error'
    );
  } else if (err?.name === 'MulterError' || err?.message === 'unsupported_file_type') {
    convertedError = new ApiError(
      multerErrorStatus(err),
      multerErrorMessage(err) || 'invalid_file_upload',
      'File Upload Error'
    );
  } else if (err?.code === 11000) {
    // Mongo duplicate key -> 409 with the offending field (safe to expose).
    const field = Object.keys(err?.keyValue || err?.keyPattern || {})[0];
    convertedError = new ApiError(
      httpStatus.CONFLICT,
      field ? `A record with this ${field} already exists.` : 'Duplicate value.',
      'Duplicate Key'
    );
  } else if (err?.name === 'CastError') {
    // Invalid ObjectId / type cast -> 400 instead of a confusing 500.
    convertedError = new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid value for ${err?.path || 'identifier'}.`,
      'Cast Error'
    );
  } else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    convertedError = new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired token.',
      'Auth Error'
    );
  } else if (!(err instanceof ApiError)) {
    let uuid = uuidv4();
    logger.error({
      uuid,
      name: err?.name,
      message: err?.message,
      code: err?.code,
      statusCode: err?.statusCode,
      stack: err?.stack,
      errors: err?.errors,
    });
    const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    convertedError = new ApiError(
      statusCode,
      process.env.NODE_ENV === 'production'
        ? (httpStatus[statusCode] || httpStatus[httpStatus.INTERNAL_SERVER_ERROR])
        : (err.message || httpStatus[httpStatus.INTERNAL_SERVER_ERROR]),
      'API Error 2',
      uuid
    );
  }

  return handler(convertedError, req, res, next);
};

/**
 * Catch 404 and forward to error handler
 * @public
 */
const notFound = (req, res, next) => {
  const err = new ApiError(
    httpStatus.NOT_FOUND,
    'This API does not exist',
    'API Not found'
  );
  return handler(err, req, res, next);
};

export default { handler, notFound, converter };
