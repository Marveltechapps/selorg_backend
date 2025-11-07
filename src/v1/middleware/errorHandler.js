const logger = require("../config/logger");
const { failure } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && "body" in err) {
    logger.warn({ err, path: req.path }, "Malformed JSON payload");
    return failure(res, {
      statusCode: 400,
      message: "Invalid JSON payload"
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
      requestId: req.id
    },
    message
  );

  return failure(res, {
    statusCode,
    message,
    errors: err.metadata || err.errors || undefined
  });
};

module.exports = { errorHandler, ApiError };
