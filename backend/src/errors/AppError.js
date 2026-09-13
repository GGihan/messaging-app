export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
};

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
};

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
};

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
};


export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
};

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
};

export class BadGatewayError extends AppError {
  constructor(message = 'Upstream service failure') {
    super(message, 502);
  }
}