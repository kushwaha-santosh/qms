import mongoose from "mongoose";

const AuditSchema = new mongoose.Schema(
  {
    // ========================================================
    // ORGANIZATION
    // ========================================================

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // ========================================================
    // AUDIT IDENTIFICATION
    // ========================================================

    auditNumber: {
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

    // ========================================================
    // QMS REFERENCES
    // ========================================================

    /*
     * Audit Type is maintained in QMS Master Data.
     *
     * Example:
     * INTERNAL
     * EXTERNAL
     * CUSTOMER
     * SUPPLIER
     * REGULATORY
     * PROCESS
     * PRODUCT
     *
     * Do not define a static enum here.
     */
    auditType: {
      type: String,
      trim: true,
      index: true,
    },

    department: {
      type: String,
      trim: true,
    },

    process: {
      type: String,
      trim: true,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    // ========================================================
    // AUDIT DETAILS
    // ========================================================

    scope: {
      type: String,
      trim: true,
    },

    criteria: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    findings: {
      type: String,
      trim: true,
    },

    // ========================================================
    // DATES
    // ========================================================

    auditDate: {
      type: Date,
      index: true,
    },

    dueDate: {
      type: Date,
      index: true,
    },

    completedDate: {
      type: Date,
    },

    // ========================================================
    // AUDITORS
    // ========================================================

    leadAuditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    auditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ========================================================
    // COMMON QMS STATUS
    // ========================================================

    /*
     * Status is maintained in common QMS Master Data.
     *
     * Example:
     * OPEN
     * IN_PROGRESS
     * COMPLETED
     * CANCELLED
     *
     * Do not define a static enum here.
     */
    status: {
      type: String,
      trim: true,
      default: "OPEN",
      index: true,
    },

    /*
     * Latest comment entered during a status change.
     *
     * Status changes are handled separately from the
     * normal Audit edit operation.
     */
    statusComment: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // RELATED QMS RECORDS
    // ========================================================

    ncrReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NCR",
      },
    ],

    capaReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CAPA",
      },
    ],

    // ========================================================
    // AUDIT OWNERSHIP
    // ========================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  {
    timestamps: true,

    /*
     * Keep strict mode enabled so that only fields explicitly
     * defined in this schema are persisted.
     */
    strict: true,
  },
);

// ==========================================================
// INDEXES
// ==========================================================

AuditSchema.index({
  organizationId: 1,
  createdAt: -1,
});

AuditSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

AuditSchema.index({
  organizationId: 1,
  auditDate: -1,
});

AuditSchema.index(
  {
    organizationId: 1,
    auditNumber: 1,
  },
  {
    unique: true,
  },
);

// ==========================================================
// MODEL
// ==========================================================

export default mongoose.models.Audit || mongoose.model("Audit", AuditSchema);
