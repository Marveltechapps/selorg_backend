const express = require("express");
const router = express.Router();
const otpController = require("../controller/otpController");
const authenticateToken = require("../auths/authenticationToken");
const { validate } = require("../middleware/validate");
const {
  sendOTPSchema,
  verifyOTPSchema,
  resendOTPSchema
} = require("../validations/authValidation");

// Route to send OTP
router.post("/send-otp", validate(sendOTPSchema), otpController.sendOTP);

// Route to verify OTP
router.post("/verify-otp", validate(verifyOTPSchema), otpController.verifyOTP);

// Route to resend OTP
router.post("/resend-otp", validate(resendOTPSchema), otpController.resendOTP);

module.exports = router;
