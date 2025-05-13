const Extension = require("../models/extension");
const ActivityLog = require("../models/activityLog");
const logger = require("../utils/logger");

// @desc    Get all whitelisted extensions
// @route   GET /api/whitelist
// @access  Private
exports.getWhitelistedExtensions = async (req, res) => {
  try {
    // Add filters for active/inactive if provided
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const extensions = await Extension.find(filter)
      .sort({ addedDate: -1 })
      .populate("addedBy", "name email");

    res.status(200).json({
      success: true,
      count: extensions.length,
      data: extensions,
    });
  } catch (error) {
    logger.error(`Get whitelist error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve whitelisted extensions",
    });
  }
};

// @desc    Add extension to whitelist
// @route   POST /api/whitelist
// @access  Private/Admin
exports.addToWhitelist = async (req, res) => {
  try {
    const { extensionId, name, description, version } = req.body;

    // Check if already exists
    const existingExtension = await Extension.findOne({ extensionId });
    if (existingExtension) {
      return res.status(400).json({
        success: false,
        message: "Extension already in whitelist",
      });
    }

    // Create extension
    const extension = await Extension.create({
      extensionId,
      name,
      description,
      version,
      addedBy: req.user.id,
      isActive: true,
    });

    // Log the action
    await ActivityLog.createLog({
      userId: req.user._id.toString(),
      action: "WHITELIST_UPDATED",
      extensionId,
      ipAddress: req.ip,
      details: { operation: "add", extensionName: name },
    });

    res.status(201).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    logger.error(`Add to whitelist error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to add extension to whitelist",
    });
  }
};

// @desc    Update whitelisted extension
// @route   PUT /api/whitelist/:id
// @access  Private/Admin
exports.updateWhitelistedExtension = async (req, res) => {
  try {
    const extensionId = req.params.id;
    const { name, description, version, isActive } = req.body;

    // Find extension
    let extension = await Extension.findOne({ extensionId });
    if (!extension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found",
      });
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (version) updateData.version = version;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update extension
    extension = await Extension.findOneAndUpdate({ extensionId }, updateData, {
      new: true,
      runValidators: true,
    });

    // Log the action
    await ActivityLog.createLog({
      userId: req.user._id.toString(),
      action: "WHITELIST_UPDATED",
      extensionId,
      ipAddress: req.ip,
      details: {
        operation: "update",
        extensionName: name || extension.name,
        changes: updateData,
      },
    });

    res.status(200).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    logger.error(`Update whitelist error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to update whitelisted extension",
    });
  }
};

// @desc    Remove extension from whitelist
// @route   DELETE /api/whitelist/:id
// @access  Private/Admin
exports.removeFromWhitelist = async (req, res) => {
  try {
    const extensionId = req.params.id;

    // Find extension
    const extension = await Extension.findOne({ extensionId });
    if (!extension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found",
      });
    }

    // Store name for log
    const extensionName = extension.name;

    // Remove extension
    await extension.deleteOne();

    // Log the action
    await ActivityLog.createLog({
      userId: req.user._id.toString(),
      action: "WHITELIST_UPDATED",
      extensionId,
      ipAddress: req.ip,
      details: { operation: "remove", extensionName },
    });

    res.status(200).json({
      success: true,
      message: "Extension removed from whitelist",
    });
  } catch (error) {
    logger.error(`Remove from whitelist error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to remove extension from whitelist",
    });
  }
};

// @desc    Check if extension is whitelisted
// @route   GET /api/whitelist/check/:id
// @access  Public (for extension use)
exports.checkIfWhitelisted = async (req, res) => {
  try {
    const extensionId = req.params.id;

    // Check if extension is whitelisted
    const isWhitelisted = await Extension.isWhitelisted(extensionId);

    res.status(200).json({
      success: true,
      isWhitelisted,
    });
  } catch (error) {
    logger.error(`Check whitelist error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to check whitelist status",
    });
  }
};

// @desc    Get extension details
// @route   GET /api/whitelist/:id
// @access  Private
exports.getExtensionDetails = async (req, res) => {
  try {
    const extensionId = req.params.id;

    // Find extension with populated user info
    const extension = await Extension.findOne({ extensionId }).populate(
      "addedBy",
      "name email"
    );

    if (!extension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found",
      });
    }

    res.status(200).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    logger.error(`Get extension error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to get extension details",
    });
  }
};
