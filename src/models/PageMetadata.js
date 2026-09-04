import mongoose from "mongoose";

const pageMetadataSchema = new mongoose.Schema(
  {
    // ==========================================================
    // PAGE IDENTIFICATION
    // ==========================================================

    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    path: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // ==========================================================
    // META INFORMATION
    // ==========================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    keywords: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ==========================================================
    // PAGE TYPE
    // ==========================================================
    //
    // SYSTEM:
    //   Page belongs to the QMS application.
    //
    // CUSTOM:
    //   Page was created manually from Page Metadata Management.
    //
    // This allows the UI/backend to distinguish application pages
    // from user-created metadata.
    //

    pageType: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      default: "CUSTOM",
      index: true,
    },

    // ==========================================================
    // DELETE CONTROL
    // ==========================================================
    //
    // System pages normally should not be physically deleted.
    // Custom metadata can be deleted.
    //
    // This field gives the backend an additional safety layer.
    //

    isDeletable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================================
// NORMALIZE KEY
// ==========================================================

pageMetadataSchema.pre("validate", function (next) {
  if (this.key) {
    this.key = String(this.key).trim().toLowerCase();
  }

  if (this.path) {
    const normalizedPath = String(this.path).trim();

    this.path = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
  }

  next();
});

// ==========================================================
// MODEL
// ==========================================================

const PageMetadata =
  mongoose.models.PageMetadata ||
  mongoose.model("PageMetadata", pageMetadataSchema);

export default PageMetadata;
