const express = require("express");
const router = express.Router();
const {
  logActivity,
  getActivitiesByUser,
  getActivitiesByExtension,
  getAllActivities,
  getActivityStats,
} = require("../controllers/activityController");
const {
  protect,
  authorize,
  verifyExtensionKey,
} = require("../middleware/auth");
const {
  validate,
  activityLogValidationRules,
} = require("../middleware/validation");

// Extension authenticated routes
router.post(
  "/",
  verifyExtensionKey,
  activityLogValidationRules.create,
  validate,
  logActivity
);

// Protected routes
router.get("/user/:userId", protect, getActivitiesByUser);

// Admin routes
router.get("/", protect, authorize("admin"), getAllActivities);
router.get("/stats", protect, authorize("admin"), getActivityStats);
router.get(
  "/extension/:extensionId",
  protect,
  authorize("admin"),
  getActivitiesByExtension
);

module.exports = router;
