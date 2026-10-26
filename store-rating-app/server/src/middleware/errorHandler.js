const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const AppError = require('../utils/AppError');
const { isTest, nodeEnv } = require('../config/env');

// 404 for unknown routes
exports.notFound = (req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

// Centralised error handler: every error leaves the API in the same JSON shape.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Something went wrong on the server';
  let errors;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 422;
    message = 'Validation failed';
    errors = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'body';
      if (!errors[key]) errors[key] = issue.message;
    }
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      const target = (err.meta && err.meta.target) || [];
      const fields = Array.isArray(target) ? target : [String(target)];
      const field = fields.includes('email') || fields.some((f) => String(f).includes('email')) ? 'email' : fields[0];
      message = field === 'email' ? 'This email is already registered' : 'A record with these values already exists';
      errors = field ? { [field]: message } : undefined;
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Record not found';
    } else if (err.code === 'P2003' || err.code === 'P2010' || err.code === '23514') {
      status = 400;
      message = 'The request violates a data integrity rule';
    }
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  // Database-level rule violations raised by PostgreSQL (CHECK / trigger)
  if (status === 500 && err.meta && err.meta.code === '23514') {
    status = 400;
    message = 'The request violates a data integrity rule';
  }

  if (status >= 500 && !isTest) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (status >= 500 && nodeEnv === 'development') body.debug = err.message;
  res.status(status).json(body);
};
