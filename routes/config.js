const express = require("express");
const router = express.Router();
const {
  getConfig,
  updateConfig,
  resetConfig,
  getConfigValue,
  deleteConfigValue,
  getAllConfigs,
} = require("../controllers/configController");
const {
  protect,
  authorize,
  verifyExtensionKey,
} = require("../middleware/auth");
const { validate, configValidationRules } = require("../middleware/validation");

// Extension authenticated routes
router.get("/", verifyExtensionKey, getConfig);

// Admin routes
router.get("/all", protect, authorize("admin"), getAllConfigs);
router.get("/:key", protect, authorize("admin"), getConfigValue);
router.put(
  "/",
  protect,
  authorize("admin"),
  configValidationRules.update,
  validate,
  updateConfig
);
router.post("/reset", protect, authorize("admin"), resetConfig);
router.delete("/:key", protect, authorize("admin"), deleteConfigValue);

module.exports = router;
