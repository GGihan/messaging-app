import { isProduction, isTest } from "../config/env.js";
import { normalizeError } from "../errors";

export const handleError = (err, req, res, next) => {
  const error = normalizeError(err);

  const statusCode = error.statusCode || 500;

  const message =
    statusCode === 500 && isProduction
      ? 'An unexpected error occurred on the server.'
      : error.message || 'An unexpected error occurred on the server.';

  if ((statusCode >= 500 || !error.isOperational) && !isTest) {
    console.error('Error Trace:', err.stack || err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && { stack: err.stack }),
  });
};