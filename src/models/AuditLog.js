import mongoose from "mongoose";

// ==========================================================
// AUDIT LOG SCHEMA
// ==========================================================


const auditLogSchema = new mongoose.Schema(
  {
    // ========================================================
    // ORGANIZATION / TENANT
    // ========================================================
    //
   

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    // ========================================================
    // USER WHO PERFORMED THE ACTION
    // ========================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Snapshot of the user at the time of the event.
    //
    // These are stored separately from the User reference so
    // historical audit records remain understandable even
    // if the user is renamed or deleted later.

    userName: {
      type: String,
      default: "",
      trim: true,
    },

    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ========================================================
    // ACTION
    // ========================================================
    //
    // Examples:
    //
    // CREATE
    // UPDATE
    // DELETE
    // STATUS_UPDATE
    // LOGIN
    // LOGOUT
    // PASSWORD_CHANGE
    // ROLE_UPDATE
    // PERMISSION_UPDATE
    // APPROVE
    // REJECT
    // SUBMIT
    // CLOSE
    // REOPEN
    //
    // No enum is intentionally used.
    //
    // This allows future modules to introduce actions without
    // modifying the AuditLog model.
    //

    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ========================================================
    // MODULE
    // ========================================================
    //
    // Examples:
    //
    // AUTH
    // USER
    // PROFILE
    // ROLE
    // PERMISSION
    // ORGANIZATION
    // NCR
    // CAPA
    // DOCUMENT
    // AUDIT
    // TRAINING
    // SUPPLIER
    // SETTINGS
    //

    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ========================================================
    // AFFECTED RECORD
    // ========================================================
    //
    // Usually a MongoDB ObjectId.
    //
    // Mixed is intentional because some system events may
    // not have a database record:
    //
    // LOGIN
    // LOGOUT
    // PASSWORD_RESET_REQUESTED
    // SYSTEM events
    //

    recordId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },

    // ========================================================
    // DESCRIPTION
    // ========================================================

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // OLD DATA
    // ========================================================
    //
    // State before the operation.
    //
    // Usually populated for:
    //
    // UPDATE
    // DELETE
    // STATUS_UPDATE
    //
    // Sanitized by auditLog.service.js before persistence.
    //

    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ========================================================
    // NEW DATA
    // ========================================================
    //
    // State after the operation.
    //
    // Usually populated for:
    //
    // CREATE
    // UPDATE
    // STATUS_UPDATE
    //
    // Sanitized by auditLog.service.js before persistence.
    //

    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ========================================================
    // REQUEST INFORMATION
    // ========================================================

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,

    // Do not silently store fields that are not part of the
    // audit schema.
    strict: true,
  }
);

// ==========================================================
// INDEXES
// ==========================================================

// Latest audit events for an organization
auditLogSchema.index({
  organizationId: 1,
  createdAt: -1,
});

// Module history
auditLogSchema.index({
  organizationId: 1,
  module: 1,
  createdAt: -1,
});

// Action history
auditLogSchema.index({
  organizationId: 1,
  action: 1,
  createdAt: -1,
});

// User activity history
auditLogSchema.index({
  organizationId: 1,
  userId: 1,
  createdAt: -1,
});

// Record history
//
// This will later allow us to display:
//
// NCR → complete history
// CAPA → complete history
// Permission → complete history
// User → complete history
//

auditLogSchema.index({
  organizationId: 1,
  recordId: 1,
  createdAt: -1,
});

// ==========================================================
// MODEL
// ==========================================================
//
// Prevent OverwriteModelError during hot reload / nodemon.
//

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model(
    "AuditLog",
    auditLogSchema
  );

export default AuditLog;

