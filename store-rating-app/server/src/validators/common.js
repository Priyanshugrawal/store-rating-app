const { z } = require('zod');

// ---- Field rules required by the challenge ---------------------------------
exports.name = z
  .string({ required_error: 'Name is required', invalid_type_error: 'Name must be text' })
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be at most 60 characters');

exports.address = z
  .string({ required_error: 'Address is required', invalid_type_error: 'Address must be text' })
  .trim()
  .min(1, 'Address is required')
  .max(400, 'Address must be at most 400 characters');

exports.email = z
  .string({ required_error: 'Email is required', invalid_type_error: 'Email must be text' })
  .trim()
  .toLowerCase()
  .max(255, 'Email must be at most 255 characters')
  .email('Enter a valid email address');

exports.password = z
  .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
  .min(8, 'Password must be at least 8 characters')
  .max(16, 'Password must be at most 16 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

exports.rating = z
  .number({ required_error: 'Rating is required', invalid_type_error: 'Rating must be a number from 1 to 5' })
  .int('Rating must be a whole number')
  .min(1, 'Rating must be between 1 and 5')
  .max(5, 'Rating must be between 1 and 5');

exports.roleEnum = z.enum(['ADMIN', 'USER', 'OWNER'], {
  errorMap: () => ({ message: 'Role must be ADMIN, USER or OWNER' }),
});

exports.idParam = z.object({
  id: z.coerce.number({ invalid_type_error: 'Invalid id' }).int('Invalid id').positive('Invalid id'),
});

// ---- Shared list-query helpers -----------------------------------------------
exports.paginationShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  order: z.enum(['asc', 'desc']).default('asc'),
};
const optionalText = z.string().trim().max(400).optional().transform((v) => (v ? v : undefined));
exports.optionalText = optionalText;
