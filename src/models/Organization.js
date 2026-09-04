
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
      ],
      default: "ACTIVE",
    },

    plan: {
      type: String,
      enum: [
        "FREE",
        "STARTER",
        "PROFESSIONAL",
        "ENTERPRISE",
      ],
      default: "FREE",
    },

    address: {
      addressLine1: {
        type: String,
        trim: true,
        default: "",
      },

      addressLine2: {
        type: String,
        trim: true,
        default: "",
      },

      city: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "",
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },

      postalCode: {
        type: String,
        trim: true,
        default: "",
      },
    },

    settings: {
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },

      dateFormat: {
        type: String,
        default: "DD-MM-YYYY",
      },

      currency: {
        type: String,
        default: "INR",
      },
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Organization email must be unique.
 */
organizationSchema.index(
  { email: 1 },
  { unique: true }
);

const Organization =
  mongoose.models.Organization ||
  mongoose.model(
    "Organization",
    organizationSchema
  );

export default Organization;

