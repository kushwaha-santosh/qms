import mongoose from "mongoose";

const roleSchema =
new mongoose.Schema(
{
name: {
type: String,
required: true,
uppercase: true,
trim: true,
},


  displayName: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    default: "",
    trim: true,
  },

  scope: {
    type: String,
    enum: [
      "SYSTEM",
      "ORGANIZATION",
    ],
    required: true,
  },

  organizationId: {
    type:
      mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    default: null,
  },

  permissions: [
    {
      type:
        mongoose.Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],

  /*
   * IMPORTANT:
   *
   * This field is retained for backward compatibility
   * with existing database records.
   *
   * Authorization/protection must NOT depend on this
   * field.
   *
   * scope === "SYSTEM" is the authoritative indicator
   * for a protected system role.
   */
  isSystemRole: {
    type: Boolean,
    default: false,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
},
{
  timestamps: true,
}


);

// ==========================================================
// ROLE UNIQUENESS
// ==========================================================

roleSchema.index(
{
name: 1,
organizationId: 1,
},
{
unique: true,
}
);

// ==========================================================
// MODEL
// ==========================================================

const Role =
mongoose.models.Role ||
mongoose.model(
"Role",
roleSchema
);

export default Role;
