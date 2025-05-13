// Chrome extension ID validation
// Chrome extension IDs are 32 character strings
exports.isValidChromeExtensionId = (extensionId) => {
  if (!extensionId) return false;

  const extensionIdRegex = /^[a-z]{32}$/;
  return extensionIdRegex.test(extensionId);
};

// Email validation
exports.isValidEmail = (email) => {
  if (!email) return false;

  const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailRegex.test(email.toLowerCase());
};

// Password strength check
// Requires at least 8 characters, one uppercase, one lowercase, one number, one special character
exports.isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

// Check if object is empty
exports.isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Sanitize input to prevent XSS
exports.sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Validate object against schema
exports.validateObject = (object, schema) => {
  const errors = [];

  Object.keys(schema).forEach((key) => {
    // Required check
    if (
      schema[key].required &&
      (object[key] === undefined || object[key] === null || object[key] === "")
    ) {
      errors.push(`${key} is required`);
      return;
    }

    // Skip further validation if value is not provided and not required
    if (object[key] === undefined || object[key] === null) {
      return;
    }

    // Type check
    if (schema[key].type && typeof object[key] !== schema[key].type) {
      errors.push(`${key} must be a ${schema[key].type}`);
    }

    // Min length check
    if (schema[key].minLength && object[key].length < schema[key].minLength) {
      errors.push(
        `${key} must be at least ${schema[key].minLength} characters`
      );
    }

    // Max length check
    if (schema[key].maxLength && object[key].length > schema[key].maxLength) {
      errors.push(
        `${key} cannot be more than ${schema[key].maxLength} characters`
      );
    }

    // Pattern check
    if (schema[key].pattern && !schema[key].pattern.test(object[key])) {
      errors.push(`${key} is invalid format`);
    }

    // Enum check
    if (schema[key].enum && !schema[key].enum.includes(object[key])) {
      errors.push(`${key} must be one of: ${schema[key].enum.join(", ")}`);
    }

    // Custom validation
    if (schema[key].validate && typeof schema[key].validate === "function") {
      const isValid = schema[key].validate(object[key]);
      if (!isValid) {
        errors.push(schema[key].message || `${key} is invalid`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
