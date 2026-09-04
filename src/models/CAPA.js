import mongoose from "mongoose";

const CAPASchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    capaNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // QMS-wide master data codes.
    source: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    severity: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      trim: true,
      default: "OPEN",
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    process: {
      type: String,
      trim: true,
      default: "",
    },

    // Product/Location Master IDs are stored as strings for backward compatibility.
    product: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    rootCauseCategory: {
      type: String,
      trim: true,
      default: "",
    },

    comments: {
      type: String,
      default: "",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    immediateAction: {
      type: String,
      trim: true,
      default: "",
    },

    rootCause: {
      type: String,
      trim: true,
      default: "",
    },

    correctiveAction: {
      type: String,
      trim: true,
      default: "",
    },

    preventiveAction: {
      type: String,
      trim: true,
      default: "",
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
  },
);

CAPASchema.index({
  organizationId: 1,
  status: 1,
});

CAPASchema.index({
  organizationId: 1,
  capaNumber: 1,
});

CAPASchema.index({
  organizationId: 1,
  assignedTo: 1,
});

const CAPA = mongoose.models.CAPA || mongoose.model("CAPA", CAPASchema);

export default CAPA;
