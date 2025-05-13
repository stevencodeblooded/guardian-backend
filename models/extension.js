const mongoose = require("mongoose");

const ExtensionSchema = new mongoose.Schema(
  {
    extensionId: {
      type: String,
      required: [true, "Please provide an extension ID"],
      unique: true,
      trim: true,
      // Chrome extension IDs are 32 characters long
      match: [
        /^[a-z]{32}$/,
        "Extension ID must be a valid Chrome extension ID",
      ],
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    version: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedDate: {
      type: Date,
      default: Date.now,
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

// Create composite index for faster lookup
ExtensionSchema.index({ extensionId: 1, isActive: 1 });

// Update the 'updatedAt' field on save
ExtensionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to check if an extension is whitelisted
ExtensionSchema.statics.isWhitelisted = async function (extensionId) {
  const extension = await this.findOne({
    extensionId,
    isActive: true,
  });
  return !!extension;
};

module.exports = mongoose.model("Extension", ExtensionSchema);
