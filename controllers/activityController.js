const ActivityLog = require("../models/activityLog");
const logger = require("../utils/logger");

// @desc    Log activity
// @route   POST /api/activity
// @access  Protected (Extension API)
exports.logActivity = async (req, res) => {
  try {
    const { userId, action, extensionId, browserInfo, details } = req.body;

    // Create log entry
    const log = await ActivityLog.createLog({
      userId,
      action,
      extensionId,
      browserInfo: browserInfo || {},
      details: details || {},
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    logger.error(`Log activity error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to log activity",
    });
  }
};

// @desc    Get activities by user
// @route   GET /api/activity/user/:userId
// @access  Private
exports.getActivitiesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 100;

    // Check if admin or request is for own logs
    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these logs",
      });
    }

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    logger.error(`Get activities error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs",
    });
  }
};

// @desc    Get activities by extension
// @route   GET /api/activity/extension/:extensionId
// @access  Private/Admin
exports.getActivitiesByExtension = async (req, res) => {
  try {
    const extensionId = req.params.extensionId;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await ActivityLog.find({ extensionId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    logger.error(`Get extension activities error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve extension activity logs",
    });
  }
};

// @desc    Get all activities (admin only)
// @route   GET /api/activity
// @access  Private/Admin
exports.getAllActivities = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Filter by action if provided
    const filter = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // Get total count
    const total = await ActivityLog.countDocuments(filter);

    // Get logs with pagination
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination,
      data: logs,
    });
  } catch (error) {
    logger.error(`Get all activities error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs",
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/activity/stats
// @access  Private/Admin
exports.getActivityStats = async (req, res) => {
  try {
    // Get count of each action type
    const actionCounts = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get count by day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCounts = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get most active users
    const activeUsers = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        actionCounts,
        dailyCounts,
        activeUsers,
      },
    });
  } catch (error) {
    logger.error(`Get activity stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity statistics",
    });
  }
};
