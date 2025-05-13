const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  getUsers,
  deleteUser,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validate, userValidationRules } = require("../middleware/validation");

// Public routes
router.post("/register", userValidationRules.register, validate, register);
router.post("/login", userValidationRules.login, validate, login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/update-details", protect, updateDetails);
router.put("/update-password", protect, updatePassword);
router.post("/logout", protect, logout);

// Admin routes
router.get("/users", protect, authorize("admin"), getUsers);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
