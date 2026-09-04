import mongoose from "mongoose";

import Role from "@/models/Role.js";
import Permission from "@/models/Permission.js";
import Organization from "@/models/Organization.js";

import { createAuditLog } from "@/services/auditLog/auditLog.service.js";

import { ROLES } from "@/lib/auth/permissions.js";

import { ORGANIZATION_ROLES } from "@/services/rbac/organizationRoles.service.js";

// ==========================================================
// HELPERS
// ==========================================================

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

// ==========================================================
// AUDIT ROLE ACTION
// ==========================================================

const auditRoleAction = async ({
  action,
  role,
  oldData = null,
  newData = null,
  description,
  audit = {},
}) => {
  await createAuditLog({
    organizationId:
      audit.organizationId ||
      role?.organizationId?._id ||
      role?.organizationId ||
      null,

    userId: audit.userId || audit.user?._id || audit.user?.id || null,

    userName: audit.userName || "",

    userEmail: audit.userEmail || "",

    action,
    module: "ROLE",

    recordId: role?._id || role?.id || null,

    description,

    oldData,
    newData,

    ipAddress: audit.ipAddress || audit.ip || "",

    userAgent: audit.userAgent || "",
  });
};

// ==========================================================
// NORMALIZE ID
// ==========================================================

const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

// ==========================================================
// VALID OBJECT ID
// ==========================================================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// ==========================================================
// GET USER ORGANIZATION ID
// ==========================================================

const getUserOrganizationId = (user) => {
  return user?.organizationId?._id || user?.organizationId || null;
};

// ==========================================================
// CHECK ORGANIZATION
// ==========================================================

const ensureOrganizationExists = async (organizationId) => {
  if (!organizationId) {
    throw createError("Organization ID is required.", 400);
  }

  if (!isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID.", 400);
  }

  const organization =
    await Organization.findById(organizationId).select("_id name status");

  if (!organization) {
    throw createError("Organization not found.", 404);
  }

  return organization;
};

// ==========================================================
// CHECK ROLE ACCESS
// ==========================================================

const ensureRoleBelongsToUser = (role, user) => {
  if (!role) {
    throw createError("Role not found.", 404);
  }

  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  if (user?.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  const userOrganizationId = normalizeId(getUserOrganizationId(user));

  const roleOrganizationId = normalizeId(role.organizationId);

  if (
    !userOrganizationId ||
    !roleOrganizationId ||
    userOrganizationId !== roleOrganizationId
  ) {
    throw createError("You do not have access to this role.", 403);
  }

  return true;
};

// ==========================================================
// CHECK PROTECTED SYSTEM ROLE
// ==========================================================
//
// IMPORTANT
// ----------------------------------------------------------
// `isSystemRole` is NOT used here.
//
// Some existing organization roles may have:
//
//   isSystemRole: true
//
// but they remain configurable.
//
// Only:
//
//   scope: "SYSTEM"
//
// is protected.
//
// ==========================================================

const isProtectedSystemRole = (role) => {
  return role?.scope === "SYSTEM";
};

// ==========================================================
// FIND ROLE
// ==========================================================

const findRoleById = async (roleId) => {
  if (!roleId) {
    throw createError("Role ID is required.", 400);
  }

  if (!isValidObjectId(roleId)) {
    throw createError("Invalid role ID.", 400);
  }

  const role = await Role.findById(roleId)
    .populate({
      path: "permissions",

      match: {
        isActive: true,
      },

      select: "_id key name description module action isActive",
    })

    .populate({
      path: "organizationId",

      select: "_id name email status plan",
    })

    .lean();

  if (!role) {
    throw createError("Role not found.", 404);
  }

  return role;
};

// ==========================================================
// VALIDATE PERMISSIONS
// ==========================================================

const validatePermissions = async (permissionIds = []) => {
  if (permissionIds === undefined || permissionIds === null) {
    return [];
  }

  if (!Array.isArray(permissionIds)) {
    throw createError("Permissions must be an array.", 400);
  }

  const uniqueIds = [...new Set(permissionIds.map((id) => String(id)))];

  for (const id of uniqueIds) {
    if (!isValidObjectId(id)) {
      throw createError(`Invalid permission ID: ${id}`, 400);
    }
  }

  if (uniqueIds.length === 0) {
    return [];
  }

  const permissions = await Permission.find({
    _id: {
      $in: uniqueIds,
    },

    isActive: true,
  }).select("_id key name module action");

  if (permissions.length !== uniqueIds.length) {
    const foundIds = new Set(
      permissions.map((permission) => String(permission._id)),
    );

    const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

    throw createError(
      `One or more permissions are invalid or inactive: ${missingIds.join(", ")}`,
      400,
    );
  }

  return permissions.map((permission) => permission._id);
};

// ==========================================================
// CHECK DEFAULT ORGANIZATION ROLE
// ==========================================================

const isSupportedOrganizationRole = (roleName) => {
  return ORGANIZATION_ROLES.some((role) => role.name === roleName);
};

// ==========================================================
// LIST ROLES
// ==========================================================

export const listRoles = async ({
  user,
  organizationId = null,
  search = "",
  scope = "",
  isActive = "",
} = {}) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  const query = {};

  // --------------------------------------------------------
  // SCOPE
  // --------------------------------------------------------

  if (scope) {
    if (!["SYSTEM", "ORGANIZATION"].includes(scope)) {
      throw createError("Invalid role scope.", 400);
    }

    query.scope = scope;
  }

  // --------------------------------------------------------
  // ACTIVE STATUS
  // --------------------------------------------------------

  if (isActive !== "") {
    if (isActive === true || isActive === "true") {
      query.isActive = true;
    } else if (isActive === false || isActive === "false") {
      query.isActive = false;
    }
  }

  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  // if (isSuperAdmin) {
  //   if (organizationId) {
  //     await ensureOrganizationExists(organizationId);

  //     query.scope = "ORGANIZATION";

  //     query.organizationId = organizationId;
  //   } else if (scope === "ORGANIZATION") {
  //     throw createError(
  //       "Organization ID is required when viewing organization roles.",
  //       400,
  //     );
  //   } else {
  //     query.scope = "SYSTEM";

  //     query.organizationId = null;
  //   }
  // }
  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  if (isSuperAdmin) {
    if (organizationId) {
      await ensureOrganizationExists(organizationId);

      query.scope = "ORGANIZATION";
      query.organizationId = organizationId;
    } else if (scope === "ORGANIZATION") {
      throw createError(
        "Organization ID is required when viewing organization roles.",
        400,
      );
    } else if (scope === "SYSTEM") {
      query.scope = "SYSTEM";
      query.organizationId = null;
    } else {
      // query.scope = "SYSTEM";
      // query.organizationId = null;
    }
  }
  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------
  else {
    const userOrganizationId = getUserOrganizationId(user);

    if (!userOrganizationId) {
      throw createError("User is not associated with an organization.", 403);
    }

    query.scope = "ORGANIZATION";

    query.organizationId = userOrganizationId;
  }

  // --------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------

  const trimmedSearch = String(search || "").trim();

  if (trimmedSearch) {
    query.$or = [
      {
        name: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },

      {
        displayName: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },

      {
        description: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
    ];
  }

  const roles = await Role.find(query)
    .populate({
      path: "permissions",

      match: {
        isActive: true,
      },

      select: "_id key name description module action isActive",
    })

    .populate({
      path: "organizationId",

      select: "_id name email status plan",
    })

    .sort({
      scope: 1,
      name: 1,
    })

    .lean();

  return roles;
};

// ==========================================================
// GET ROLE
// ==========================================================

export const getRole = async ({ user, roleId } = {}) => {
  const role = await findRoleById(roleId);

  ensureRoleBelongsToUser(role, user);

  return role;
};

// ==========================================================
// CREATE ROLE
// ==========================================================

export const createRole = async ({
  user,
  name,
  displayName,
  description = "",
  scope = "ORGANIZATION",
  organizationId = null,
  permissions = [],
  audit = {},
} = {}) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const normalizedName = String(name || "")
    .trim()
    .toUpperCase();

  const normalizedDisplayName = String(displayName || "").trim();

  const normalizedDescription = String(description || "").trim();

  if (!normalizedName) {
    throw createError("Role name is required.");
  }

  if (!normalizedDisplayName) {
    throw createError("Role display name is required.");
  }

  if (!["SYSTEM", "ORGANIZATION"].includes(scope)) {
    throw createError("Invalid role scope.");
  }

  // ------------------------------------------------------
  // SYSTEM ROLES
  // ------------------------------------------------------

  if (scope === "SYSTEM") {
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw createError("Only SUPER_ADMIN can create system roles.", 403);
    }

    throw createError(
      "System role creation is disabled. System roles are provisioned by the application.",
      403,
    );
  }

  // ------------------------------------------------------
  // ORGANIZATION
  // ------------------------------------------------------

  let targetOrganizationId = organizationId;

  if (user.role !== ROLES.SUPER_ADMIN) {
    targetOrganizationId = getUserOrganizationId(user);
  }

  if (!targetOrganizationId) {
    throw createError("Organization ID is required.");
  }

  await ensureOrganizationExists(targetOrganizationId);

  // ------------------------------------------------------
  // DEFAULT ROLE VALIDATION
  // ------------------------------------------------------
  //
  // Existing application architecture uses User.role as
  // a string. Therefore roles assigned directly to users
  // must currently belong to the supported role list.
  //
  // Custom Role support should be introduced only after
  // User.role is migrated from String to Role reference.
  //

  if (!isSupportedOrganizationRole(normalizedName)) {
    throw createError(
      `Unsupported role "${normalizedName}". Custom roles require User.role to reference Role before they can be created.`,
      400,
    );
  }

  const existingRole = await Role.findOne({
    name: normalizedName,

    organizationId: targetOrganizationId,
  });

  if (existingRole) {
    throw createError(
      "A role with this name already exists in this organization.",
      409,
    );
  }

  const permissionIds = await validatePermissions(permissions);

  const role = await Role.create({
    name: normalizedName,

    displayName: normalizedDisplayName,

    description: normalizedDescription,

    scope: "ORGANIZATION",

    organizationId: targetOrganizationId,

    permissions: permissionIds,

    isSystemRole: false,

    isActive: true,
  });

  const createdRole = await findRoleById(role._id);

  await auditRoleAction({
    action: "CREATE",

    role: createdRole,

    newData: createdRole,

    description: `Created role ${createdRole.displayName || createdRole.name}.`,

    audit,
  });

  return createdRole;
};

// ==========================================================
// UPDATE ROLE
// ==========================================================

export const updateRole = async ({
  user,
  roleId,
  displayName,
  description,
  isActive,
  audit = {},
} = {}) => {
  const role = await findRoleById(roleId);

  ensureRoleBelongsToUser(role, user);

  // ------------------------------------------------------
  // PROTECTED SYSTEM ROLE
  // ------------------------------------------------------

  if (isProtectedSystemRole(role) && user?.role !== ROLES.SUPER_ADMIN) {
    throw createError("System roles cannot be modified.", 403);
  }

  const update = {};

  if (displayName !== undefined) {
    const value = String(displayName || "").trim();

    if (!value) {
      throw createError("Role display name cannot be empty.");
    }

    update.displayName = value;
  }

  if (description !== undefined) {
    update.description = String(description || "").trim();
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw createError("isActive must be a boolean.");
    }

    update.isActive = isActive;
  }

  if (Object.keys(update).length === 0) {
    return role;
  }

  await Role.findByIdAndUpdate(
    roleId,

    {
      $set: update,
    },

    {
      new: true,
      runValidators: true,
    },
  );

  const updatedRole = await findRoleById(roleId);

  await auditRoleAction({
    action:
      isActive !== undefined && Object.keys(update).length === 1
        ? "STATUS_UPDATE"
        : "UPDATE",

    role: updatedRole,

    oldData: role,

    newData: updatedRole,

    description: `Updated role ${updatedRole.displayName || updatedRole.name}.`,

    audit,
  });

  return updatedRole;
};

// ==========================================================
// DELETE ROLE
// ==========================================================

export const deleteRole = async ({ user, roleId, audit = {} } = {}) => {
  const role = await findRoleById(roleId);

  ensureRoleBelongsToUser(role, user);

  // ------------------------------------------------------
  // SYSTEM ROLE
  // ------------------------------------------------------

  if (isProtectedSystemRole(role)) {
    throw createError("System roles cannot be deleted.", 403);
  }

  // ------------------------------------------------------
  // DEFAULT ORGANIZATION ROLES
  // ------------------------------------------------------

  if (isSupportedOrganizationRole(role.name)) {
    throw createError(
      "Default organization roles cannot be deleted. Deactivate the role instead.",
      403,
    );
  }

  await Role.findByIdAndDelete(roleId);

  await auditRoleAction({
    action: "DELETE",

    role,

    oldData: role,

    description: `Deleted role ${role.displayName || role.name}.`,

    audit,
  });

  return {
    success: true,

    message: "Role deleted successfully.",
  };
};

// ==========================================================
// UPDATE ROLE PERMISSIONS
// ==========================================================

export const updateRolePermissions = async ({
  user,
  roleId,
  permissions = [],
  audit = {},
} = {}) => {
  const role = await findRoleById(roleId);

  ensureRoleBelongsToUser(role, user);

  // ------------------------------------------------------
  // SYSTEM ROLE
  // ------------------------------------------------------

  if (isProtectedSystemRole(role) && user?.role !== ROLES.SUPER_ADMIN) {
    throw createError("System role permissions cannot be modified.", 403);
  }

  const permissionIds = await validatePermissions(permissions);

  const updatedRole = await Role.findByIdAndUpdate(
    roleId,

    {
      $set: {
        permissions: permissionIds,
      },
    },

    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedRole) {
    throw createError("Role not found.", 404);
  }

  const populatedUpdatedRole = await findRoleById(roleId);

  await auditRoleAction({
    action: "PERMISSION_UPDATE",

    role: populatedUpdatedRole,

    oldData: role,

    newData: populatedUpdatedRole,

    description: `Updated permissions for role ${populatedUpdatedRole.displayName || populatedUpdatedRole.name}.`,

    audit,
  });

  return populatedUpdatedRole;
};

// ==========================================================
// UPDATE ROLE STATUS
// ==========================================================
//
// Kept as a service method for reuse.
//
// Current API route uses:
//
//   PATCH /api/roles/:roleId
//
// with:
//
//   { isActive: true/false }
//
// ==========================================================

export const updateRoleStatus = async ({
  user,
  roleId,
  isActive,
  audit = {},
} = {}) => {
  return updateRole({
    user,
    roleId,
    isActive,
    audit,
  });
};
