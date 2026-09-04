import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // ORGANIZATION / SYSTEM SCOPE
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PRODUCT INFORMATION
    // ----------------------------------------------------------

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    modelNumber: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // ----------------------------------------------------------
    // MASTER DATA REFERENCES
    // ----------------------------------------------------------

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData",
      default: null,
      index: true,
    },

    uomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData",
      default: null,
      index: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData",
      default: null,
      index: true,
    },

    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData",
      default: null,
      index: true,
    },

    // ----------------------------------------------------------
    // LEGACY CATEGORY
    // ----------------------------------------------------------
    // Kept for backward compatibility with older records.

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ----------------------------------------------------------
    // QUANTITY
    // ----------------------------------------------------------

    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ----------------------------------------------------------
    // AUDIT
    // ----------------------------------------------------------

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

// --------------------------------------------------------------
// INDEXES
// --------------------------------------------------------------

ProductSchema.index(
  {
    organizationId: 1,
    code: 1,
  },
  {
    unique: true,
  },
);

ProductSchema.index({
  organizationId: 1,
  name: 1,
});

ProductSchema.index({
  organizationId: 1,
  isActive: 1,
});

ProductSchema.index({
  organizationId: 1,
  createdAt: -1,
});

ProductSchema.index({
  organizationId: 1,
  categoryId: 1,
});

ProductSchema.index({
  organizationId: 1,
  uomId: 1,
});

ProductSchema.index({
  organizationId: 1,
  brandId: 1,
});

ProductSchema.index({
  organizationId: 1,
  productTypeId: 1,
});

ProductSchema.index({
  isSystem: 1,
  isActive: 1,
});

// --------------------------------------------------------------
// NORMALIZATION
// --------------------------------------------------------------

ProductSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.modelNumber) {
    this.modelNumber = this.modelNumber.trim();
  }

  if (this.description) {
    this.description = this.description.trim();
  }

  if (this.category) {
    this.category = this.category.trim();
  }

  // System products are always global.
  if (this.isSystem) {
    this.organizationId = null;
  }
});

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
