const success = (res, { statusCode = 200, message = "Success", data, meta }) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });

const failure = (
  res,
  { statusCode = 500, message = "Something went wrong", errors, meta }
) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    meta
  });

module.exports = { success, failure };
