const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Create a schema for the config
const ConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create the model if it doesn't exist yet
const Config = mongoose.models.Config || mongoose.model("Config", ConfigSchema);

// Default extension configuration
const defaultConfig = {
  enableNotifications: true,
  clearOnDisable: true,
  clearOnClose: true,
  clearItems: {
    cookies: true,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    cache: true,
    history: false,
  },
  requestTimeoutMs: 10000,
  heartbeatIntervalMs: 5000,
  checkIntervalMs: 3000,
  apiRetryAttempts: 3,
  apiRetryDelayMs: 1000,
  guardianExtensionId: null, // Will be set later
  debugMode: false,
};

// @desc    Get extension configuration
// @route   GET /api/config
// @access  Public (for extension use)
exports.getConfig = async (req, res) => {
  try {
    // Get all config values
    const configs = await Config.find();

    // Create configuration object starting with defaults
    const configObject = { ...defaultConfig };

    // Override with values from database
    configs.forEach((config) => {
      configObject[config.key] = config.value;
    });

    // Add the requesting extension ID as the guardian ID if not set
    if (req.extensionId && !configObject.guardianExtensionId) {
      configObject.guardianExtensionId = req.extensionId;

      // Save this to the database
      await Config.findOneAndUpdate(
        { key: "guardianExtensionId" },
        {
          key: "guardianExtensionId",
          value: req.extensionId,
          description: "ID of the guardian extension",
          updatedBy: null,
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      data: configObject,
    });
  } catch (error) {
    logger.error(`Get config error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve configuration",
    });
  }
};

// @desc    Update extension configuration
// @route   PUT /api/config
// @access  Private/Admin
exports.updateConfig = async (req, res) => {
  try {
    const updates = req.body;
    const updatedConfigs = [];

    // Process each key in the request
    for (const [key, value] of Object.entries(updates)) {
      // Skip if key is not in defaultConfig (except guardianExtensionId)
      if (!defaultConfig.hasOwnProperty(key) && key !== "guardianExtensionId") {
        continue;
      }

      // Special handling for nested objects like clearItems
      if (key === "clearItems" && typeof value === "object") {
        // Get existing clearItems or use default
        const existingConfig = await Config.findOne({ key });
        const existingValue = existingConfig
          ? existingConfig.value
          : defaultConfig.clearItems;

        // Merge with updates
        const mergedValue = { ...existingValue, ...value };

        const updated = await Config.findOneAndUpdate(
          { key },
          {
            key,
            value: mergedValue,
            description: `Items to clear when extension is disabled or browser is closed`,
            updatedBy: req.user._id,
            updatedAt: Date.now(),
          },
          { upsert: true, new: true }
        );

        updatedConfigs.push(updated);
      } else {
        // Regular updates
        const updated = await Config.findOneAndUpdate(
          { key },
          {
            key,
            value,
            description: getConfigDescription(key),
            updatedBy: req.user._id,
            updatedAt: Date.now(),
          },
          { upsert: true, new: true }
        );

        updatedConfigs.push(updated);
      }
    }

    // Get the full updated config
    const allConfigs = await Config.find();
    const configObject = { ...defaultConfig };

    allConfigs.forEach((config) => {
      configObject[config.key] = config.value;
    });

    res.status(200).json({
      success: true,
      message: "Configuration updated",
      updates: updatedConfigs,
      data: configObject,
    });
  } catch (error) {
    logger.error(`Update config error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
    });
  }
};

// @desc    Reset configuration to defaults
// @route   POST /api/config/reset
// @access  Private/Admin
exports.resetConfig = async (req, res) => {
  try {
    // Get guardianExtensionId before reset
    const guardianConfig = await Config.findOne({ key: "guardianExtensionId" });
    const guardianExtensionId = guardianConfig ? guardianConfig.value : null;

    // Delete all configs
    await Config.deleteMany({});

    // Restore guardianExtensionId if it was set
    if (guardianExtensionId) {
      await Config.create({
        key: "guardianExtensionId",
        value: guardianExtensionId,
        description: "ID of the guardian extension",
        updatedBy: req.user._id,
        updatedAt: Date.now(),
      });
    }

    // Return the default config with guardianExtensionId if it was set
    const configObject = { ...defaultConfig };
    if (guardianExtensionId) {
      configObject.guardianExtensionId = guardianExtensionId;
    }

    res.status(200).json({
      success: true,
      message: "Configuration reset to defaults",
      data: configObject,
    });
  } catch (error) {
    logger.error(`Reset config error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to reset configuration",
    });
  }
};

// Helper function to get description for config keys
function getConfigDescription(key) {
  const descriptions = {
    enableNotifications: "Enable browser notifications for important events",
    clearOnDisable: "Clear browser data when extension is disabled",
    clearOnClose: "Clear browser data when browser is closed",
    clearItems:
      "Items to clear when extension is disabled or browser is closed",
    requestTimeoutMs: "API request timeout in milliseconds",
    heartbeatIntervalMs: "Heartbeat check interval in milliseconds",
    checkIntervalMs:
      "Interval in milliseconds to check for unauthorized extensions",
    apiRetryAttempts: "Number of API retry attempts on failure",
    apiRetryDelayMs: "Delay between API retry attempts in milliseconds",
    guardianExtensionId: "ID of the guardian extension",
    debugMode: "Enable debug logging",
  };

  return descriptions[key] || `Configuration value for ${key}`;
}

// @desc    Get a specific config value
// @route   GET /api/config/:key
// @access  Private
exports.getConfigValue = async (req, res) => {
  try {
    const key = req.params.key;

    // Check if key is valid
    if (!defaultConfig.hasOwnProperty(key) && key !== "guardianExtensionId") {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration key",
      });
    }

    // Get config from database
    const config = await Config.findOne({ key });

    // If not in database, return default
    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          key,
          value: defaultConfig[key],
          description: getConfigDescription(key),
          isDefault: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        key: config.key,
        value: config.value,
        description: config.description,
        updatedBy: config.updatedBy,
        updatedAt: config.updatedAt,
        isDefault: false,
      },
    });
  } catch (error) {
    logger.error(`Get config value error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve configuration value",
    });
  }
};

// @desc    Delete a config value (reset to default)
// @route   DELETE /api/config/:key
// @access  Private/Admin
exports.deleteConfigValue = async (req, res) => {
  try {
    const key = req.params.key;

    // Don't allow deleting guardianExtensionId
    if (key === "guardianExtensionId") {
      return res.status(400).json({
        success: false,
        message: "Guardian Extension ID cannot be reset",
      });
    }

    // Check if key is valid
    if (!defaultConfig.hasOwnProperty(key)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration key",
      });
    }

    // Delete from database
    await Config.deleteOne({ key });

    res.status(200).json({
      success: true,
      message: `Configuration ${key} reset to default`,
      data: {
        key,
        value: defaultConfig[key],
        description: getConfigDescription(key),
      },
    });
  } catch (error) {
    logger.error(`Delete config value error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to reset configuration value",
    });
  }
};

// @desc    Get all configurations with defaults applied
// @route   GET /api/config/all
// @access  Private/Admin
exports.getAllConfigs = async (req, res) => {
  try {
    // Get all config values from database
    const configs = await Config.find().populate("updatedBy", "name email");

    // Create result array with default and custom values
    const result = [];

    // Add all default configs first
    for (const [key, value] of Object.entries(defaultConfig)) {
      const config = configs.find((c) => c.key === key);

      if (config) {
        // Config exists in database
        result.push({
          key,
          value: config.value,
          description: config.description || getConfigDescription(key),
          updatedBy: config.updatedBy,
          updatedAt: config.updatedAt,
          isDefault: false,
        });
      } else {
        // Use default value
        result.push({
          key,
          value,
          description: getConfigDescription(key),
          isDefault: true,
        });
      }
    }

    // Add any additional configs not in defaults
    configs.forEach((config) => {
      if (!defaultConfig.hasOwnProperty(config.key)) {
        result.push({
          key: config.key,
          value: config.value,
          description: config.description,
          updatedBy: config.updatedBy,
          updatedAt: config.updatedAt,
          isDefault: false,
        });
      }
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    logger.error(`Get all configs error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve all configurations",
    });
  }
};
