const { z } = require("zod");

/**
 * Validation schema for product search
 */
const searchProductsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format").optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format").optional(),
  inStock: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional()
});

/**
 * Validation schema for getting products with filters
 */
const getProductsSchema = z.object({
  category: z.string().optional(),
  mainCategory: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format").optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format").optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["createdAt", "price", "title", "averageRating"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional()
});

/**
 * Validation schema for autocomplete
 */
const autocompleteSchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional()
});

/**
 * Validation schema for checking availability
 */
const checkAvailabilitySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional()
});

module.exports = {
  searchProductsSchema,
  getProductsSchema,
  autocompleteSchema,
  checkAvailabilitySchema
};

