import mongoose from "mongoose";

export const LOCATION_TYPES = [
  "COUNTRY",
  "STATE",
  "DISTRICT",
  "CITY",
  "PINCODE",
];

const LocationSchema = new mongoose.Schema(
  {
    /*
     * ==========================================================
     * LOCATION TYPE
     * ==========================================================
     */

    type: {
      type: String,
      enum: LOCATION_TYPES,
      required: true,
      index: true,
    },

    /*
     * ==========================================================
     * NAME
     * ==========================================================
     */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    /*
     * ==========================================================
     * CODE
     *
     * Country:
     *   IN
     *
     * State:
     *   UP
     *
     * District:
     *   GZP
     *
     * City:
     *   GHAZIPUR
     *
     * Pincode:
     *   233001
     * ==========================================================
     */

    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    /*
     * ==========================================================
     * PARENT
     *
     * COUNTRY  -> null
     * STATE    -> COUNTRY
     * DISTRICT -> STATE
     * CITY     -> DISTRICT
     * PINCODE  -> CITY
     * ==========================================================
     */

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    /*
     * ==========================================================
     * DENORMALIZED HIERARCHY
     *
     * These fields make filtering and reporting considerably
     * faster than recursively traversing parentId.
     * ==========================================================
     */

    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    /*
     * ==========================================================
     * PINCODE
     * ==========================================================
     */

    pincode: {
      type: String,
      trim: true,
      maxlength: 10,
      index: true,
    },

    /*
     * ==========================================================
     * STATUS
     * ==========================================================
     */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
     * ==========================================================
     * AUDIT USERS
     * ==========================================================
     */

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
 * ============================================================
 * INDEXES
 * ============================================================
 *
 * Same name/code cannot exist under the same parent.
 */

LocationSchema.index(
  {
    type: 1,
    parentId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

LocationSchema.index({
  type: 1,
  parentId: 1,
  isActive: 1,
});

LocationSchema.index({
  type: 1,
  stateId: 1,
  districtId: 1,
  cityId: 1,
});

LocationSchema.index({
  pincode: 1,
  cityId: 1,
});

export default mongoose.models.Location ||
  mongoose.model("Location", LocationSchema);
