const authService = require('../../../src/v1/service/authService');
const UserModel = require('../../../src/v1/service/userModel');
const smsService = require('../../../src/v1/service/smsService');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../../../src/v1/model/userModel');
jest.mock('../../../src/v1/service/smsService');
jest.mock('bcryptjs');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 4-digit OTP', () => {
      const otp = authService.generateOTP();
      
      expect(otp).toMatch(/^\d{4}$/);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(1000);
      expect(parseInt(otp)).toBeLessThanOrEqual(9999);
    });
  });

  describe('validateMobileNumber', () => {
    it('should validate correct mobile numbers', () => {
      expect(authService.validateMobileNumber('9876543210')).toBe(true);
      expect(authService.validateMobileNumber('1234567890')).toBe(true);
    });

    it('should reject invalid mobile numbers', () => {
      expect(authService.validateMobileNumber('0000000000')).toBe(false);
      expect(authService.validateMobileNumber('123')).toBe(false);
      expect(authService.validateMobileNumber('abcdefghij')).toBe(false);
      expect(authService.validateMobileNumber('')).toBe(false);
    });
  });

  describe('hashOTP', () => {
    it('should hash OTP using bcrypt', async () => {
      const otp = '1234';
      const hashedOTP = 'hashed_otp';
      
      bcrypt.hash.mockResolvedValue(hashedOTP);
      
      const result = await authService.hashOTP(otp);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(otp, 10);
      expect(result).toBe(hashedOTP);
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP correctly', async () => {
      const plainOTP = '1234';
      const hashedOTP = 'hashed_otp';
      
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await authService.verifyOTP(plainOTP, hashedOTP);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(plainOTP, hashedOTP);
      expect(result).toBe(true);
    });

    it('should return false for incorrect OTP', async () => {
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await authService.verifyOTP('1234', 'hashed_otp');
      
      expect(result).toBe(false);
    });
  });

  describe('sendOTP', () => {
    it('should send OTP successfully for new user', async () => {
      const mobileNumber = '9876543210';
      
      UserModel.findOne.mockResolvedValue(null);
      UserModel.prototype.save = jest.fn().mockResolvedValue(true);
      smsService.sendOTP.mockResolvedValue({ success: true });
      bcrypt.hash.mockResolvedValue('hashed_otp');

      const result = await authService.sendOTP(mobileNumber);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expiresIn', 300);
    });

    it('should throw error for invalid mobile number', async () => {
      await expect(authService.sendOTP('invalid'))
        .rejects
        .toThrow('Invalid mobile number format');
    });
  });

  describe('verifyOTPAndLogin', () => {
    it('should verify OTP and return token for valid OTP', async () => {
      const user = {
        _id: 'user123',
        mobileNumber: '9876543210',
        otp: 'hashed_otp',
        otpExpiresAt: new Date(Date.now() + 300000),
        save: jest.fn().mockResolvedValue(true)
      };

      UserModel.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.verifyOTPAndLogin('9876543210', '1234');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('token');
      expect(user.isVerified).toBe(true);
      expect(user.otp).toBeNull();
    });

    it('should throw error for expired OTP', async () => {
      const user = {
        mobileNumber: '9876543210',
        otp: 'hashed_otp',
        otpExpiresAt: new Date(Date.now() - 1000) // Expired
      };

      UserModel.findOne.mockResolvedValue(user);

      await expect(authService.verifyOTPAndLogin('9876543210', '1234'))
        .rejects
        .toThrow('OTP has expired');
    });

    it('should throw error for incorrect OTP', async () => {
      const user = {
        mobileNumber: '9876543210',
        otp: 'hashed_otp',
        otpExpiresAt: new Date(Date.now() + 300000)
      };

      UserModel.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.verifyOTPAndLogin('9876543210', 'wrong'))
        .rejects
        .toThrow('Incorrect OTP');
    });
  });
});

