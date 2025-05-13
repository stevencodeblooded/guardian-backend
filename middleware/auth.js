const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { verifyToken } = require("../config/auth");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookies if not in headers
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Find user by id from decoded token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Add user to req object
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Verify extension API key
exports.verifyExtensionKey = async (req, res, next) => {
  const extensionId = req.headers["x-extension-id"];
  const apiKey = req.headers["x-api-key"];

  if (!extensionId || !apiKey) {
    return res.status(401).json({
      success: false,
      message: "Extension authentication required"
    });
  }

  // For development, accept any API key that starts with the extension ID
  // This allows the extension to self-generate keys during development
  const isValidKey = apiKey.startsWith(extensionId + "-");
  
  // Log the validation attempt (for debugging)
  console.log(`Extension auth attempt: ID=${extensionId}, Valid=${isValidKey}`);

  if (!isValidKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid extension credentials"
    });
  }

  // Add extension ID to req object
  req.extensionId = extensionId;
  next();
};