/**
 * Swagger/OpenAPI Configuration
 * API Documentation setup
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SELORG API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for SELORG e-commerce platform - Your trusted source for organic products',
    contact: {
      name: 'SELORG Support',
      email: 'support@selorg.com'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://localhost:3443',
      description: 'Development server (HTTPS)'
    },
    {
      url: 'https://api.selorg.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /v1/otp/verify-otp'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string'
                },
                message: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string'
          },
          data: {
            type: 'object'
          },
          meta: {
            type: 'object'
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 20
          },
          total: {
            type: 'integer',
            example: 100
          },
          totalPages: {
            type: 'integer',
            example: 5
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'OTP-based authentication endpoints'
    },
    {
      name: 'Users',
      description: 'User management and profile endpoints'
    },
    {
      name: 'Products',
      description: 'Product search, filtering, variants, and discovery'
    },
    {
      name: 'Cart',
      description: 'Shopping cart management, delivery instructions, tips'
    },
    {
      name: 'Orders',
      description: 'Order creation, management, and real-time tracking'
    },
    {
      name: 'Payment Methods',
      description: 'Saved payment methods management (cards)'
    },
    {
      name: 'Order Tracking',
      description: 'Real-time delivery partner tracking and location updates'
    },
    {
      name: 'Wishlist',
      description: 'Wishlist management'
    },
    {
      name: 'Reviews',
      description: 'Product reviews and ratings'
    },
    {
      name: 'Coupons',
      description: 'Coupon validation and application'
    },
    {
      name: 'Addresses',
      description: 'Delivery address management'
    },
    {
      name: 'Locations',
      description: 'Location search and geocoding'
    },
    {
      name: 'Notifications',
      description: 'Multi-channel notifications (In-app, SMS, Email, WhatsApp, Push)'
    },
    {
      name: 'Banners',
      description: 'Promotional banner management and content CMS'
    },
    {
      name: 'Content',
      description: 'Static content, FAQs, Terms & Conditions'
    },
    {
      name: 'Support & Chat',
      description: 'Customer support chat with real-time messaging'
    },
    {
      name: 'Returns & Refunds',
      description: 'Return requests and refund management'
    },
    {
      name: 'Invoices',
      description: 'Invoice generation and download'
    },
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './src/v1/route/*.js',
    './src/v1/controller/*.js',
    './src/v1/model/*.js'
  ]
};

module.exports = options;

