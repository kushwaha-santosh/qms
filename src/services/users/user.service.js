import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "@/models/User.js";
import "@/models/Organization.js";

import {
  createAuditLog,
} from "@/services/auditLog/auditLog.service.js";

import {
  isSuperAdmin,
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import { getOrganizationId } from "@/lib/auth/session.js";

const ALLOWED_ROLES = [
  "ORG_ADMIN",
  "QUALITY_MANAGER",
  "QUALITY_ENGINEER",
  "AUDITOR",
  "EMPLOYEE",
  "VIEWER",
];

const ALLOWED_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const normalizeText = (value) =>
  String(value || "").trim();

const validateObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ==========================================================
// USER DISPLAY NAME
// ==========================================================

const getDisplayName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || "Unnamed User";
};

// ==========================================================
// AUDIT USER ACTION
// ==========================================================

const auditUserAction = async ({
  action,
  targetUser,
  oldData = null,
  newData = null,
  description,
  audit = {},
}) => {
  await createAuditLog({
    organizationId:
      audit.organizationId ||
      targetUser?.organizationId ||
      null,

    userId:
      audit.userId ||
      audit.user?._id ||
      audit.user?.id ||
      null,

    userName:
      audit.userName || "",

    userEmail:
      audit.userEmail || "",

    action,
    module: "USER",

    recordId:
      targetUser?._id ||
      targetUser?.id ||
      null,

    description,
    oldData,
    newData,

    ipAddress:
      audit.ipAddress ||
      audit.ip ||
      "",

    userAgent:
      audit.userAgent ||
      "",
  });
};

/**
 * ==========================================================
 * AUTHORIZATION
 * ==========================================================
 */

const requirePermission = async ({
  user,
  permission,
}) => {
  if (!user?.role) {
    throw createError(
      "Authentication required.",
      401
    );
  }

  const authorization =
    await getAuthorizationContext(user);

  if (
    !userHasPermission(
      authorization.permissions,
      permission
    )
  ) {
    throw createError(
      "You do not have permission to perform this action.",
      403
    );
  }

  return authorization;
};

/**
 * ==========================================================
 * ORGANIZATION FILTER
 * ==========================================================
 *
 * SUPER_ADMIN is global and can work across organizations.
 *
 * Organization users are ALWAYS restricted to their own
 * organization.
 */

const getUserScope = (user) => {
  if (isSuperAdmin(user)) {
    return {};
  }

  const organizationId =
    getOrganizationId(user);

  if (!organizationId) {
    throw createError(
      "User is not associated with an organization.",
      403
    );
  }

  if (!validateObjectId(organizationId)) {
    throw createError(
      "Invalid organization ID.",
      500
    );
  }

  return {
    organizationId,
  };
};

/**
 * ==========================================================
 * LIST USERS
 * ==========================================================
 */

export const listUsers = async ({
  user,
  search = "",
  role,
  status,
  page = 1,
  limit = 20,
}) => {
  await requirePermission({
    user,
    permission: "USER_VIEW",
  });

  const scope = getUserScope(user);

  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const pageLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const filter = {
    ...scope,
  };

  if (search.trim()) {
    const regex = new RegExp(
      search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      ),
      "i"
    );

    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  const skip =
    (currentPage - 1) * pageLimit;

  const [users, total] =
    await Promise.all([
      User.find(filter)
        .select(
          "-password -passwordChangedAt"
        )
        .populate({
          path: "organizationId",
          select: "_id name email status plan",
        })
        .populate({
          path: "createdBy",
          select: "_id firstName lastName name fullName email role status",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      User.countDocuments(filter),
    ]);

  return {
    users,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(
        total / pageLimit
      ),
    },
  };
};

/**
 * ==========================================================
 * GET USER
 * ==========================================================
 */

export const getUser = async ({
  user,
  userId,
}) => {
  await requirePermission({
    user,
    permission: "USER_VIEW",
  });

  if (!validateObjectId(userId)) {
    throw createError(
      "Invalid user ID.",
      400
    );
  }

  const scope = getUserScope(user);

  const targetUser =
    await User.findOne({
      _id: userId,
      ...scope,
    })
      .select(
        "-password -passwordChangedAt"
      )
      .populate({
        path: "organizationId",
        select: "_id name email status plan",
      })
      .populate({
        path: "createdBy",
        select: "_id firstName lastName name fullName email role status",
      })
      .lean();

  if (!targetUser) {
    throw createError(
      "User not found.",
      404
    );
  }

  return targetUser;
};

/**
 * ==========================================================
 * CREATE USER
 * ==========================================================
 */

export const createUser = async ({
  user,
  data,
  audit = {},
}) => {
  await requirePermission({
    user,
    permission: "USER_CREATE",
  });

  const firstName =
    normalizeText(data?.firstName);

  const lastName =
    normalizeText(data?.lastName);

  const email =
    normalizeEmail(data?.email);

  const password =
    String(data?.password || "");

  const role =
    normalizeText(data?.role);

  const status =
    normalizeText(
      data?.status || "ACTIVE"
    );

  if (!firstName) {
    throw createError(
      "First name is required.",
      400
    );
  }

  if (!email) {
    throw createError(
      "Email is required.",
      400
    );
  }

  if (!password) {
    throw createError(
      "Password is required.",
      400
    );
  }

  if (password.length < 8) {
    throw createError(
      "Password must contain at least 8 characters.",
      400
    );
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw createError(
      "Invalid user role.",
      400
    );
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createError(
      "Invalid user status.",
      400
    );
  }

  /*
   * SUPER_ADMIN must never be created through the
   * organization-user API.
   */
  if (role === "SUPER_ADMIN") {
    throw createError(
      "SUPER_ADMIN cannot be created through the organization user API.",
      403
    );
  }

  let organizationId = null;

  if (isSuperAdmin(user)) {
    /*
     * SUPER_ADMIN must explicitly select the organization.
     */
    organizationId =
      data?.organizationId || null;

    if (
      !organizationId ||
      !validateObjectId(organizationId)
    ) {
      throw createError(
        "A valid organization ID is required.",
        400
      );
    }
  } else {
    /*
     * Organization users can ONLY create users
     * in their own organization.
     *
     * Never trust organizationId supplied by client.
     */
    organizationId =
      getOrganizationId(user);

    if (
      !organizationId ||
      !validateObjectId(organizationId)
    ) {
      throw createError(
        "User is not associated with an organization.",
        403
      );
    }
  }

  const existing =
    await User.findOne({
      email,
    }).lean();

  if (existing) {
    throw createError(
      "A user with this email already exists.",
      409
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      password,
      12
    );

  const createdUser =
    await User.create({
      organizationId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status,
      createdBy:
        user?._id || user?.id || null,
    });

  const populatedUser =
    await User.findById(
      createdUser._id
    )
      .select(
        "-password -passwordChangedAt"
      )
      .populate({
        path: "organizationId",
        select: "_id name email status plan",
      })
      .populate({
        path: "createdBy",
        select: "_id firstName lastName name fullName email role status",
      })
      .lean();

  await auditUserAction({
    action: "CREATE",
    targetUser: populatedUser,
    newData: populatedUser,
    description: `Created user ${getDisplayName(populatedUser)}.`,
    audit,
  });

  return populatedUser;
};

/**
 * ==========================================================
 * UPDATE USER
 * ==========================================================
 */

export const updateUser = async ({
  user,
  userId,
  data,
  audit = {},
}) => {
  if (!validateObjectId(userId)) {
    throw createError(
      "Invalid user ID.",
      400
    );
  }

  const targetUser =
    await getUser({
      user,
      userId,
    });

  /*
   * Determine which permissions are required
   * according to the fields being changed.
   */

  const changingRole =
    data?.role !== undefined;

  const changingStatus =
    data?.status !== undefined;

  const changingPassword =
    data?.password !== undefined;

  const changingBasicDetails =
    data?.firstName !== undefined ||
    data?.lastName !== undefined ||
    data?.email !== undefined;

  if (
    changingRole &&
    !isSuperAdmin(user)
  ) {
    await requirePermission({
      user,
      permission:
        "USER_ROLE_UPDATE",
    });
  }

  if (changingStatus) {
    await requirePermission({
      user,
      permission:
        "USER_STATUS_UPDATE",
    });
  }

  if (
    changingBasicDetails ||
    changingPassword
  ) {
    await requirePermission({
      user,
      permission: "USER_UPDATE",
    });
  }

  /*
   * Prevent modification of SUPER_ADMIN
   * through organization-user management.
   */

  if (
    targetUser.role === "SUPER_ADMIN" &&
    !isSuperAdmin(user)
  ) {
    throw createError(
      "You cannot modify a SUPER_ADMIN.",
      403
    );
  }

  const update = {};

  if (
    data?.firstName !== undefined
  ) {
    const firstName =
      normalizeText(
        data.firstName
      );

    if (!firstName) {
      throw createError(
        "First name cannot be empty.",
        400
      );
    }

    update.firstName = firstName;
  }

  if (
    data?.lastName !== undefined
  ) {
    update.lastName =
      normalizeText(
        data.lastName
      );
  }

  if (
    data?.email !== undefined
  ) {
    const email =
      normalizeEmail(
        data.email
      );

    if (!email) {
      throw createError(
        "Email cannot be empty.",
        400
      );
    }

    const duplicate =
      await User.findOne({
        email,
        _id: {
          $ne: userId,
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

  if (
    data?.password !== undefined
  ) {
    const password =
      String(data.password || "");

    if (password.length < 8) {
      throw createError(
        "Password must contain at least 8 characters.",
        400
      );
    }

    update.password =
      await bcrypt.hash(
        password,
        12
      );

    update.passwordChangedAt =
      new Date();
  }

  if (
    data?.role !== undefined
  ) {
    const role =
      normalizeText(
        data.role
      );

    if (
      !ALLOWED_ROLES.includes(
        role
      )
    ) {
      throw createError(
        "Invalid user role.",
        400
      );
    }

    if (
      role === "SUPER_ADMIN"
    ) {
      throw createError(
        "SUPER_ADMIN cannot be assigned through this API.",
        403
      );
    }

    update.role = role;
  }

  if (
    data?.status !== undefined
  ) {
    const status =
      normalizeText(
        data.status
      );

    if (
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      throw createError(
        "Invalid user status.",
        400
      );
    }

    update.status = status;
  }

  if (
    Object.keys(update).length === 0
  ) {
    return targetUser;
  }

  /*
   * Re-apply tenant scope directly to the update.
   *
   * This prevents a user from changing a record
   * outside their organization even if an ID is guessed.
   */

  const scope = getUserScope(user);

  const updatedUser =
    await User.findOneAndUpdate(
      {
        _id: userId,
        ...scope,
      },
      {
        $set: update,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
      .select(
        "-password -passwordChangedAt"
      )
      .populate({
        path: "organizationId",
        select: "_id name email status plan",
      })
      .populate({
        path: "createdBy",
        select: "_id firstName lastName name fullName email role status",
      })
      .lean();

  if (!updatedUser) {
    throw createError(
      "User not found.",
      404
    );
  }

  const auditAction =
    changingRole
      ? "ROLE_UPDATE"
      : changingStatus
        ? "STATUS_UPDATE"
        : changingPassword
          ? "PASSWORD_CHANGE"
          : "UPDATE";

  const changedFields = Object.keys(update);

  await auditUserAction({
    action: auditAction,
    targetUser: updatedUser,
    oldData: targetUser,
    newData: updatedUser,
    description: `Updated user ${getDisplayName(updatedUser)}. Changed fields: ${changedFields.join(", ")}.`,
    audit,
  });

  return updatedUser;
};

/**
 * ==========================================================
 * DELETE USER
 * ==========================================================
 */

export const deleteUser = async ({
  user,
  userId,
  audit = {},
}) => {
  await requirePermission({
    user,
    permission: "USER_DELETE",
  });

  if (!validateObjectId(userId)) {
    throw createError(
      "Invalid user ID.",
      400
    );
  }

  const targetUser =
    await User.findOne({
      _id: userId,
      ...getUserScope(user),
    })
      .select(
        "firstName lastName email role status organizationId createdBy createdAt updatedAt"
      )
      .populate({
        path: "organizationId",
        select: "_id name email status plan",
      })
      .populate({
        path: "createdBy",
        select: "_id firstName lastName name fullName email role status",
      })
      .lean();

  if (!targetUser) {
    throw createError(
      "User not found.",
      404
    );
  }

  if (
    targetUser.role === "SUPER_ADMIN"
  ) {
    throw createError(
      "SUPER_ADMIN cannot be deleted through this API.",
      403
    );
  }

  /*
   * Prevent deleting yourself.
   */

  const currentUserId =
    String(
      user?._id ||
        user?.id ||
        ""
    );

  if (
    currentUserId ===
    String(userId)
  ) {
    throw createError(
      "You cannot delete your own account.",
      400
    );
  }

  await User.deleteOne({
    _id: userId,
    ...getUserScope(user),
  });

  await auditUserAction({
    action: "DELETE",
    targetUser,
    oldData: targetUser,
    description: `Deleted user ${getDisplayName(targetUser)}.`,
    audit,
  });

  return {
    deleted: true,
    userId,
  };
};