const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    extensionId: {
      type: String,
      index: true,
    },
    browserInfo: {
      type: Object,
      default: {},
    },
    details: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create composite index for faster queries
ActivityLogSchema.index({ userId: 1, action: 1, timestamp: -1 });

// Method to create a standardized log entry
ActivityLogSchema.statics.createLog = async function (logData) {
  return await this.create({
    userId: logData.userId,
    action: logData.action,
    extensionId: logData.extensionId || null,
    browserInfo: logData.browserInfo || {},
    details: logData.details || {},
    ipAddress: logData.ipAddress,
    timestamp: Date.now(),
  });
};

// Method to get recent logs for a user
ActivityLogSchema.statics.getRecentLogs = async function (userId, limit = 100) {
  return await this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

// Method to get logs by extension ID
ActivityLogSchema.statics.getExtensionLogs = async function (
  extensionId,
  limit = 100
) {
  return await this.find({ extensionId }).sort({ timestamp: -1 }).limit(limit);
};

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
