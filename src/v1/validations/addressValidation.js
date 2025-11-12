const { z } = require("zod");

/**
 * Coordinates schema
 */
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180")
});

/**
 * Validation schema for creating/updating address
 */
const addressSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().optional(),
  landmark: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  instructions: z.string().optional(),
  isDefault: z.boolean().optional()
});

/**
 * Validation schema for updating address
 */
const updateAddressSchema = addressSchema.partial();

/**
 * Validation schema for checking delivery availability
 */
const checkDeliverySchema = z.object({
  zipCode: z.string().min(1, "Zip code is required")
});

module.exports = {
  addressSchema,
  updateAddressSchema,
  checkDeliverySchema,
  coordinatesSchema
};

