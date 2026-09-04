import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    documentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    documentType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    revision: {
      type: String,
      trim: true,
      default: "0",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      trim: true,
      uppercase: true,
      default: "DRAFT",
      index: true,
    },

    statusComment: {
      type: String,
      trim: true,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    effectiveDate: {
      type: Date,
      default: null,
    },

    reviewDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    fileSource: {
      type: String,
      enum: ["UPLOAD", "URL", ""],
      default: "",
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileStorageKey: {
      type: String,
      trim: true,
      default: "",
    },

    fileAbsolutePath: {
      type: String,
      trim: true,
      default: "",
    },

    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

DocumentSchema.index(
  {
    organizationId: 1,
    documentNumber: 1,
  },
  {
    unique: true,
  },
);

DocumentSchema.index({
  organizationId: 1,
  status: 1,
});

DocumentSchema.index({
  organizationId: 1,
  title: 1,
});

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
