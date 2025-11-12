const { z } = require("zod");

/**
 * Delivery Instructions Validation Schema
 * Matches the UI checkboxes and text input
 */
const deliveryInstructionsSchema = z.object({
  noContactDelivery: z.boolean().optional(),
  dontRingBell: z.boolean().optional(),
  petAtHome: z.boolean().optional(),
  leaveAtDoor: z.boolean().optional(),
  callUponArrival: z.boolean().optional(),
  additionalNotes: z.string().max(500).optional()
});

module.exports = {
  deliveryInstructionsSchema
};



