const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Chrome extensions have a specific origin format
    // Check if the origin is allowed by matching the start of the string
    const isAllowed = allowedOrigins.some((allowedOrigin) =>
      origin.startsWith(allowedOrigin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Extension-ID"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

module.exports = corsOptions;
