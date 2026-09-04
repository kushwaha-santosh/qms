import mongoose from "mongoose";

const userRef = { type: mongoose.Schema.Types.ObjectId, ref: "User" };

const NCRSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    ncrNumber: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, required: true, trim: true },

    // QMS-wide master data codes.
    source: { type: String, trim: true, required: true, default: "" },
    severity: { type: String, trim: true, required: true, default: "" },
    category: { type: String, trim: true, required: true, default: "" },
    department: { type: String, trim: true, default: "" },
    process: { type: String, trim: true, default: "" },

    // Product/Location Master IDs are stored as strings for backward compatibility.
    product: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },

    batchNumber: { type: String, trim: true, default: "" },
    supplier: { type: String, trim: true, default: "" },
    detectedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    immediateAction: { type: String, trim: true, default: "" },
    containmentAction: { type: String, trim: true, default: "" },
    rootCause: { type: String, trim: true, default: "" },
    correctiveAction: { type: String, trim: true, default: "" },
    preventiveAction: { type: String, trim: true, default: "" },
    verification: { type: String, trim: true, default: "" },
    closureComment: { type: String, trim: true, default: "" },
    assignedTo: { ...userRef, default: null },
    reportedBy: { ...userRef, required: true },
    createdBy: { ...userRef, required: true },
    updatedBy: { ...userRef, required: true },
    verifiedBy: { ...userRef, default: null },
    verifiedAt: { type: Date, default: null },
    closedBy: { ...userRef, default: null },
    closedAt: { type: Date, default: null },
    capaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CAPA",
      default: null,
    },
    status: {
      type: String,
      trim: true,
      required: true,
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true },
);

NCRSchema.index({ organizationId: 1, ncrNumber: 1 }, { unique: true });
NCRSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
NCRSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
NCRSchema.index({ organizationId: 1, category: 1, severity: 1 });

export default mongoose.models.NCR || mongoose.model("NCR", NCRSchema);
