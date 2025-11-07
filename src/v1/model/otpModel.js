const mongoose = require("mongoose");
const config = require("../../config.json");
const debugMode = config.debugMode;
const axios = require("axios");
const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true
  },
  otpExpiry: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
