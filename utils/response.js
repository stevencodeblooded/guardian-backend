// Success response
exports.successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  const response = {
    success: true,
  };

  if (message) response.message = message;
  if (data !== null) response.data = data;

  return res.status(statusCode).json(response);
};

// Error response
exports.errorResponse = (
  res,
  message = "An error occurred",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  // Log in development mode
  if (process.env.NODE_ENV === "development") {
    console.error(message);
    if (errors) console.error(errors);
  }

  return res.status(statusCode).json(response);
};

// Not found response
exports.notFoundResponse = (res, message = "Resource not found") => {
  return exports.errorResponse(res, message, 404);
};

// Validation error response
exports.validationErrorResponse = (res, errors) => {
  return exports.errorResponse(res, "Validation failed", 400, errors);
};

// Unauthorized response
exports.unauthorizedResponse = (res, message = "Unauthorized") => {
  return exports.errorResponse(res, message, 401);
};

// Forbidden response
exports.forbiddenResponse = (res, message = "Forbidden") => {
  return exports.errorResponse(res, message, 403);
};
