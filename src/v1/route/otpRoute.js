const express = require("express");
const router = express.Router();
const otpController = require("../controller/otpController");
const authenticateToken = require("../auths/authenticationToken");
// Route to send OTP
router.post("/send-otp", otpController.sendOTP);

// Route to verify OTP
router.post("/verify-otp", otpController.verifyOTP);

// // Route to resend OTP
router.post("/resend-otp", otpController.resendOTP);

module.exports = router;
