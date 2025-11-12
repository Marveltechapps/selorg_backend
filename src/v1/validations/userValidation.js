const { z } = require("zod");

/**
 * Validation schema for creating a user
 */
const createUserSchema = z.object({
  mobileNumber: z.string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d{10}$/, "Mobile number must contain only digits"),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  isVerified: z.boolean().optional(),
  notificationPreferences: z.object({
    orderUpdates: z.boolean().optional(),
    marketing: z.boolean().optional(),
    appUpdates: z.boolean().optional()
  }).optional()
});

/**
 * Validation schema for updating user profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email format").optional(),
  notificationPreferences: z.object({
    orderUpdates: z.boolean().optional(),
    marketing: z.boolean().optional(),
    appUpdates: z.boolean().optional()
  }).optional(),
  preferredStoreId: z.string().optional()
});

/**
 * Validation schema for adding device token
 */
const addDeviceTokenSchema = z.object({
  token: z.string().min(1, "Device token is required"),
  platform: z.enum(["android", "ios", "web", "unknown"]).optional()
});

/**
 * Validation schema for removing device token
 */
const removeDeviceTokenSchema = z.object({
  token: z.string().min(1, "Device token is required")
});

/**
 * Validation schema for query parameters
 */
const getUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  sortBy: z.enum(["createdAt", "name", "lastActiveAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

module.exports = {
  createUserSchema,
  updateProfileSchema,
  addDeviceTokenSchema,
  removeDeviceTokenSchema,
  getUsersQuerySchema
};

