const logger = require("../config/logger");
const { failure } = require("../utils/apiResponse");

const notFoundHandler = (req, res) => {
  logger.warn(
    { path: req.originalUrl, method: req.method },
    "Route not found"
  );
  return failure(res, {
    statusCode: 404,
    message: "Route not found",
    errors: { path: req.originalUrl }
  });
};

module.exports = { notFoundHandler };
