const express = require("express");
const router = express.Router();
const {
  getWhitelistedExtensions,
  addToWhitelist,
  updateWhitelistedExtension,
  removeFromWhitelist,
  checkIfWhitelisted,
  getExtensionDetails,
} = require("../controllers/whitelistController");
const {
  protect,
  authorize,
  verifyExtensionKey,
} = require("../middleware/auth");
const {
  validate,
  extensionValidationRules,
} = require("../middleware/validation");

// Public routes (for extension use)
router.get("/check/:id", checkIfWhitelisted);

// Extension authenticated routes
router.get("/extension", verifyExtensionKey, getWhitelistedExtensions);

// Protected routes
router.get("/", protect, getWhitelistedExtensions);
router.get("/:id", protect, getExtensionDetails);

// Admin routes
router.post(
  "/",
  protect,
  authorize("admin"),
  extensionValidationRules.create,
  validate,
  addToWhitelist
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  extensionValidationRules.update,
  validate,
  updateWhitelistedExtension
);

router.delete("/:id", protect, authorize("admin"), removeFromWhitelist);

module.exports = router;
