const { z } = require('zod');
const c = require('./common');

exports.createUserSchema = z.object({
  name: c.name,
  email: c.email,
  address: c.address,
  password: c.password,
  role: c.roleEnum,
});

exports.createStoreSchema = z.object({
  name: c.name,
  email: c.email,
  address: c.address,
  ownerId: z.coerce
    .number({ invalid_type_error: 'Select a store owner' })
    .int('Select a store owner')
    .positive('Select a store owner'),
});

exports.listUsersQuery = z.object({
  ...c.paginationShape,
  sortBy: z.enum(['name', 'email', 'address', 'role', 'createdAt']).default('createdAt'),
  name: c.optionalText,
  email: c.optionalText,
  address: c.optionalText,
  role: z.enum(['ADMIN', 'USER', 'OWNER']).optional(),
});

exports.listStoresQuery = z.object({
  ...c.paginationShape,
  sortBy: z.enum(['name', 'email', 'address', 'rating', 'createdAt']).default('name'),
  search: c.optionalText,
  name: c.optionalText,
  email: c.optionalText,
  address: c.optionalText,
});
