import mongoose from "mongoose";

export const MASTER_DATA_TYPES = [
  "QMS_SOURCE",
  "QMS_SEVERITY",
  "QMS_CATEGORY",
  "QMS_STATUS",
  "ROOT_CAUSE_CATEGORY",
  "AUDIT_TYPE",
  "SUPPLIER_TYPE",
  "SUPPLIER",
  "DOCUMENT_TYPE",
  "TRAINING_TYPE",
  "DEPARTMENT",
  "PROCESS",
  "UOM",
  // Product Master supporting master data
  "PRODUCT_CATEGORY",
  "BRAND",
  "PRODUCT_TYPE",
];

const MasterDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: MASTER_DATA_TYPES,
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

/*
 * Same code can exist in different master types
 * and in different organizations.
 *
 * Example:
 *
 * PRODUCT_CATEGORY / ELECTRONICS / Organization A
 * PRODUCT_CATEGORY / ELECTRONICS / Organization B
 *
 * are both allowed.
 */
MasterDataSchema.index(
  {
    type: 1,
    organizationId: 1,
    code: 1,
  },
  {
    unique: true,
  },
);

MasterDataSchema.index({
  type: 1,
  organizationId: 1,
  isActive: 1,
  sortOrder: 1,
});

export default mongoose.models.MasterData ||
  mongoose.model("MasterData", MasterDataSchema);
