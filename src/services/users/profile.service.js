
import mongoose from "mongoose";

import User from "@/models/User.js";

import {
  createAuditLog,
} from "@/services/auditLog/auditLog.service.js";

import {
  getAuditActorContext,
  getRequestMetadata,
} from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// ERROR HELPER
// ==========================================================

const createError = (
  message,
  statusCode = 400
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ==========================================================
// NORMALIZATION
// ==========================================================

const normalizeText = (value) =>
  String(value ?? "").trim();

const normalizeEmail = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

// ==========================================================
// DISPLAY NAME
// ==========================================================

const getDisplayName = (user) => {
  const name = [
    user?.firstName,
    user?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    name ||
    user?.email ||
    "Unnamed User"
  );
};

// ==========================================================
// GET CURRENT PROFILE
// ==========================================================

export const getProfile = async ({
  userId,
}) => {
  if (!userId) {
    throw createError(
      "Authentication required.",
      401
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    throw createError(
      "Invalid user ID.",
      400
    );
  }

  const user =
    await User.findById(userId)
      .select(
        "-password -passwordChangedAt"
      )
      .populate({
        path: "organizationId",
        select:
          "_id name email phone industry status plan",
      })
      .lean();

  if (!user) {
    throw createError(
      "User account not found.",
      404
    );
  }

  return user;
};

// ==========================================================
// UPDATE CURRENT PROFILE
// ==========================================================

export const updateProfile = async ({
  user,
  data,
  request = null,
}) => {
  if (!user?._id) {
    throw createError(
      "Authentication required.",
      401
    );
  }

  const currentUser =
    await User.findById(user._id)
      .select(
        "firstName lastName email role status organizationId"
      )
      .lean();

  if (!currentUser) {
    throw createError(
      "User account not found.",
      404
    );
  }

  // ========================================================
  // BUILD UPDATE
  // ========================================================

  const update = {};

  // --------------------------------------------------------
  // FIRST NAME
  // --------------------------------------------------------

  if (
    data?.firstName !== undefined
  ) {
    const firstName =
      normalizeText(
        data.firstName
      );

    if (!firstName) {
      throw createError(
        "First name is required.",
        400
      );
    }

    if (firstName.length > 100) {
      throw createError(
        "First name cannot exceed 100 characters.",
        400
      );
    }

    update.firstName = firstName;
  }

  // --------------------------------------------------------
  // LAST NAME
  // --------------------------------------------------------

  if (
    data?.lastName !== undefined
  ) {
    const lastName =
      normalizeText(
        data.lastName
      );

    if (lastName.length > 100) {
      throw createError(
        "Last name cannot exceed 100 characters.",
        400
      );
    }

    update.lastName = lastName;
  }

  // --------------------------------------------------------
  // EMAIL
  // --------------------------------------------------------

  if (
    data?.email !== undefined
  ) {
    const email =
      normalizeEmail(
        data.email
      );

    if (!email) {
      throw createError(
        "Email is required.",
        400
      );
    }

    if (email.length > 200) {
      throw createError(
        "Email cannot exceed 200 characters.",
        400
      );
    }

    const duplicate =
      await User.findOne({
        email,
        _id: {
          $ne: currentUser._id,
        },
      }).lean();

    if (duplicate) {
      throw createError(
        "A user with this email already exists.",
        409
      );
    }

    update.email = email;
  }

  // ========================================================
  // NOTHING TO UPDATE
  // ========================================================

  if (
    Object.keys(update).length === 0
  ) {
    return getProfile({
      userId: currentUser._id,
    });
  }

  // ========================================================
  // UPDATE USER
  // ========================================================

  const updatedUser =
    await User.findByIdAndUpdate(
      currentUser._id,
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "-password -passwordChangedAt"
      )
      .populate({
        path: "organizationId",
        select:
          "_id name email phone industry status plan",
      })
      .lean();

  if (!updatedUser) {
    throw createError(
      "Unable to update profile.",
      500
    );
  }

  // ========================================================
  // AUDIT LOG
  // ========================================================

  const actor =
    getAuditActorContext(
      user
    );

  const metadata =
    getRequestMetadata(
      request
    );

  await createAuditLog({
    organizationId:
      actor.organizationId,

    userId:
      actor.userId,

    userName:
      actor.userName,

    userEmail:
      actor.userEmail,

    action: "UPDATE",

    module: "USER_PROFILE",

    recordId:
      updatedUser._id,

    description:
      `Updated profile for ${getDisplayName(
        updatedUser
      )}.`,

    oldData: {
      firstName:
        currentUser.firstName,
      lastName:
        currentUser.lastName,
      email:
        currentUser.email,
    },

    newData: {
      firstName:
        updatedUser.firstName,
      lastName:
        updatedUser.lastName,
      email:
        updatedUser.email,
    },

    ipAddress:
      metadata.ipAddress,

    userAgent:
      metadata.userAgent,
  });

  return updatedUser;
};

