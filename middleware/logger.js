const logger = require("../utils/logger");

// Request logging middleware
exports.requestLogger = (req, res, next) => {
  // Generate a unique request ID
  const requestId = Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;

  // Log request details
  logger.info(`[${requestId}] ${req.method} ${req.originalUrl}`);

  // Log request headers in debug mode
  if (process.env.LOG_LEVEL === "debug") {
    logger.debug(`[${requestId}] Headers: ${JSON.stringify(req.headers)}`);

    // Log request body for non-GET requests
    if (req.method !== "GET" && req.body) {
      // Hide sensitive fields like passwords
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = "[HIDDEN]";
      if (sanitizedBody.token) sanitizedBody.token = "[HIDDEN]";

      logger.debug(`[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`);
    }
  }

  // Capture response data
  const originalSend = res.send;
  res.send = function (body) {
    // Log response
    const statusCode = res.statusCode;
    const statusMessage = `${statusCode} ${res.statusMessage || ""}`.trim();

    if (statusCode >= 400) {
      // Log error responses with more details
      logger.warn(`[${requestId}] Response: ${statusMessage}`);
      if (process.env.LOG_LEVEL === "debug") {
        try {
          const parsedBody = JSON.parse(body);
          logger.debug(
            `[${requestId}] Response body: ${JSON.stringify(parsedBody)}`
          );
        } catch (e) {
          // Not JSON or other error
          logger.debug(`[${requestId}] Response body: [unparseable]`);
        }
      }
    } else {
      // Log success responses
      logger.info(`[${requestId}] Response: ${statusMessage}`);
    }

    // Continue with the original send
    originalSend.call(this, body);
  };

  next();
};

// Error logging middleware
exports.errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || "unknown";

  // Log error details
  logger.error(`[${requestId}] Error: ${err.message}`);
  if (err.stack) {
    logger.error(`[${requestId}] Stack: ${err.stack}`);
  }

  next(err);
};
