import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",

      required: function () {
        return this.role !== "SUPER_ADMIN";
      },

      default: null,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,

      enum: [
        "SUPER_ADMIN",
        "ORG_ADMIN",
        "QUALITY_MANAGER",
        "QUALITY_ENGINEER",
        "AUDITOR",
        "EMPLOYEE",
        "VIEWER",
      ],

      required: true,

      default: "EMPLOYEE",
    },

    status: {
      type: String,

      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],

      default: "ACTIVE",
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    /*
     * ========================================================
     * PASSWORD RESET
     * ========================================================
     *
     * IMPORTANT:
     * We store only the SHA-256 hash of the reset token.
     * The original token is sent only through the email link.
     */

    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// ==========================================================
// INDEXES
// ==========================================================

userSchema.index({ email: 1 }, { unique: true });

userSchema.index({
  organizationId: 1,
  role: 1,
});

userSchema.index({
  organizationId: 1,
  status: 1,
});

/*
 * Helps locate active reset tokens efficiently.
 */
userSchema.index({
  passwordResetTokenHash: 1,
});

// ==========================================================
// MODEL
// ==========================================================

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
