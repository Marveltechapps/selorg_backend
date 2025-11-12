const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const UserModel = require('../../src/v1/model/userModel');

describe('Authentication API', () => {
  let testMobile = '9876543210';

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/selorg_test');
    }
  });

  afterAll(async () => {
    // Cleanup
    await UserModel.deleteMany({ mobileNumber: testMobile });
    await mongoose.connection.close();
  });

  describe('POST /v1/otp/send-otp', () => {
    it('should send OTP successfully', async () => {
      const response = await request(app)
        .post('/v1/otp/send-otp')
        .send({ mobileNumber: testMobile })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should return 400 for invalid mobile number', async () => {
      const response = await request(app)
        .post('/v1/otp/send-otp')
        .send({ mobileNumber: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for missing mobile number', async () => {
      const response = await request(app)
        .post('/v1/otp/send-otp')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /v1/otp/verify-otp', () => {
    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/v1/otp/verify-otp')
        .send({ mobileNumber: testMobile })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /v1/otp/resend-otp', () => {
    it('should return 400 for missing mobile number', async () => {
      const response = await request(app)
        .post('/v1/otp/resend-otp')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

