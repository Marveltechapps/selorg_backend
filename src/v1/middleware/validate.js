const { failure } = require("../utils/apiResponse");
const logger = require("../config/logger");

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema to validate against
 * @param {string} source - Where to get data from (body, query, params)
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      
      // Parse and validate
      const validatedData = schema.parse(dataToValidate);
      
      // Replace request data with validated data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      // Zod validation error
      if (error.name === 'ZodError') {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        logger.warn({ 
          path: req.path, 
          errors: formattedErrors 
        }, "Validation failed");

        return failure(res, {
          statusCode: 400,
          message: "Validation failed",
          errors: formattedErrors
        });
      }

      // Other errors
      logger.error({ err: error, path: req.path }, "Validation middleware error");
      return failure(res, {
        statusCode: 500,
        message: "Internal server error"
      });
    }
  };
};

/**
 * Validate multiple sources
 * @param {Object} schemas - Object with keys: body, query, params
 * @returns {Function} Express middleware
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const sources = ['body', 'query', 'params'];
      
      for (const source of sources) {
        if (schemas[source]) {
          const validatedData = schemas[source].parse(req[source]);
          req[source] = validatedData;
        }
      }
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return failure(res, {
          statusCode: 400,
          message: "Validation failed",
          errors: formattedErrors
        });
      }

      logger.error({ err: error, path: req.path }, "Validation middleware error");
      return failure(res, {
        statusCode: 500,
        message: "Internal server error"
      });
    }
  };
};

module.exports = { validate, validateMultiple };

