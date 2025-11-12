const { z } = require("zod");

/**
 * Validation schema for sending OTP
 */
const sendOTPSchema = z.object({
  mobileNumber: z.string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d{10}$/, "Mobile number must contain only digits")
    .refine(val => !val.startsWith('0000000000'), {
      message: "Invalid mobile number"
    })
});

/**
 * Validation schema for verifying OTP
 */
const verifyOTPSchema = z.object({
  mobileNumber: z.string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d{10}$/, "Mobile number must contain only digits"),
  enteredOTP: z.string()
    .min(4, "OTP must be 4 digits")
    .max(4, "OTP must be 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only digits")
});

/**
 * Validation schema for resending OTP
 */
const resendOTPSchema = sendOTPSchema;

module.exports = {
  sendOTPSchema,
  verifyOTPSchema,
  resendOTPSchema
};

