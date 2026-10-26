const { z } = require('zod');
const c = require('./common');

exports.registerSchema = z
  .object({
    name: c.name,
    email: c.email,
    address: c.address,
    password: c.password,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

exports.loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().min(1, 'Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

exports.changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
    newPassword: c.password,
    confirmPassword: z.string({ required_error: 'Please confirm your new password' }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
