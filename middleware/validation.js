const { validationResult, body, param, query } = require("express-validator");

// Middleware to handle validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  next();
};

// User validation rules
exports.userValidationRules = {
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 50 })
      .withMessage("Name cannot be more than 50 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
      ),
    body("role")
      .optional()
      .isIn(["admin", "user"])
      .withMessage("Role must be either admin or user"),
  ],
  login: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
};

// Extension validation rules
exports.extensionValidationRules = {
  create: [
    body("extensionId")
      .trim()
      .notEmpty()
      .withMessage("Extension ID is required")
      .matches(/^[a-z]{32}$/)
      .withMessage("Extension ID must be a valid Chrome extension ID"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 })
      .withMessage("Name cannot be more than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot be more than 500 characters"),
    body("version").optional().trim(),
  ],
  update: [
    param("id").notEmpty().withMessage("Extension ID is required"),
    body("name")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Name cannot be more than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot be more than 500 characters"),
    body("version").optional().trim(),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
};

// Activity log validation rules
exports.activityLogValidationRules = {
  create: [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("action")
      .notEmpty()
      .withMessage("Action is required")
      .isIn([
        "EXTENSION_INSTALLED",
        "EXTENSION_UNINSTALLED",
        "EXTENSION_ENABLED",
        "EXTENSION_DISABLED",
        "WHITELIST_VIOLATION",
        "GUARDIAN_DISABLED",
        "GUARDIAN_UNINSTALL_ATTEMPT",
        "COOKIES_CLEARED",
        "BROWSER_CLOSED",
        "LOGIN",
        "LOGOUT",
        "WHITELIST_UPDATED",
      ])
      .withMessage("Invalid action type"),
    body("extensionId").optional().trim(),
    body("browserInfo")
      .optional()
      .isObject()
      .withMessage("Browser info must be an object"),
    body("details")
      .optional()
      .isObject()
      .withMessage("Details must be an object"),
    body("ipAddress").optional().trim(),
  ],
  getByUser: [
    param("userId").notEmpty().withMessage("User ID is required"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Limit must be a number between 1 and 1000"),
  ],
};

// Config validation rules
exports.configValidationRules = {
  update: [
    body("enableNotifications")
      .optional()
      .isBoolean()
      .withMessage("enableNotifications must be a boolean"),
    body("clearOnDisable")
      .optional()
      .isBoolean()
      .withMessage("clearOnDisable must be a boolean"),
    body("clearOnClose")
      .optional()
      .isBoolean()
      .withMessage("clearOnClose must be a boolean"),
    body("clearItems")
      .optional()
      .isObject()
      .withMessage("clearItems must be an object"),
  ],
};
