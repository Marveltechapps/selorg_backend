class ApiError extends Error {
  constructor(statusCode, message, metadata = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { ApiError };
