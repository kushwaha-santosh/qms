import mongoose from "mongoose";

import Permission from "@/models/Permission.js";
import Role from "@/models/Role.js";

import {
  createAuditLog,
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
// VALID OBJECT ID
// ==========================================================

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};


// ==========================================================
// NORMALIZE PERMISSION KEY
// ==========================================================

const normalizeKey = (
  value
) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};


// ==========================================================
// FIND PERMISSION
// ==========================================================

const findPermissionById =
  async (
    permissionId
  ) => {
    if (!permissionId) {
      throw createError(
        "Permission ID is required.",
        400
      );
    }

    if (
      !isValidObjectId(
        permissionId
      )
    ) {
      throw createError(
        "Invalid permission ID.",
        400
      );
    }

    const permission =
      await Permission.findById(
        permissionId
      ).lean();

    if (!permission) {
      throw createError(
        "Permission not found.",
        404
      );
    }

    return permission;
  };


// ==========================================================
// GET ORGANIZATION ID FROM AUDIT CONTEXT
// ==========================================================
//
// Supports the current architecture:
//
// req.user.organizationId
//
// and also:
//
// req.user.organizationId._id
//
// SUPER_ADMIN intentionally has no organization.
//
// ==========================================================

const getOrganizationId =
  (
    audit = {}
  ) => {
    return (
      audit.organizationId ||
      audit.user?.organizationId?._id ||
      audit.user?.organizationId ||
      null
    );
  };


// ==========================================================
// GET USER ID FROM AUDIT CONTEXT
// ==========================================================

const getUserId =
  (
    audit = {}
  ) => {
    return (
      audit.userId ||
      audit.user?._id ||
      audit.user?.id ||
      null
    );
  };


// ==========================================================
// CREATE PERMISSION AUDIT
// ==========================================================
//
// Central wrapper used by this service.
//
// Keeping this small makes it easy to use exactly the same
// pattern in NCR, CAPA, Documents, Users, Roles, etc.
//
// ==========================================================
const auditPermissionAction =
  async ({
    action,
    permission,
    oldData = null,
    newData = null,
    description,
    audit = {},
  }) => {
    await createAuditLog({
      organizationId:
        getOrganizationId(
          audit
        ),

      userId:
        getUserId(
          audit
        ),

      userName:
        audit.userName ||
        "",

      userEmail:
        audit.userEmail ||
        "",

      action,

      module:
        "PERMISSION",

      recordId:
        permission?._id ||
        permission?.id ||
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


// ==========================================================
// LIST PERMISSIONS
// ==========================================================

export const listPermissions =
  async ({
    search = "",
    module = "",
    action = "",
    isActive = "",
  } = {}) => {

    const query = {};

    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    const trimmedSearch =
      String(
        search || ""
      ).trim();

    if (
      trimmedSearch
    ) {
      query.$or = [
        {
          key: {
            $regex:
              trimmedSearch,
            $options:
              "i",
          },
        },

        {
          name: {
            $regex:
              trimmedSearch,
            $options:
              "i",
          },
        },

        {
          description: {
            $regex:
              trimmedSearch,
            $options:
              "i",
          },
        },

        {
          module: {
            $regex:
              trimmedSearch,
            $options:
              "i",
          },
        },

        {
          action: {
            $regex:
              trimmedSearch,
            $options:
              "i",
          },
        },
      ];
    }

    // ------------------------------------------------------
    // MODULE
    // ------------------------------------------------------

    const normalizedModule =
      String(
        module || ""
      ).trim();

    if (
      normalizedModule
    ) {
      query.module =
        normalizedModule;
    }

    // ------------------------------------------------------
    // ACTION
    // ------------------------------------------------------

    const normalizedAction =
      String(
        action || ""
      ).trim();

    if (
      normalizedAction
    ) {
      query.action =
        normalizedAction;
    }

    // ------------------------------------------------------
    // ACTIVE STATUS
    // ------------------------------------------------------

    if (
      isActive !== ""
    ) {
      if (
        isActive === true ||
        isActive === "true"
      ) {
        query.isActive =
          true;
      } else if (
        isActive === false ||
        isActive === "false"
      ) {
        query.isActive =
          false;
      }
    }

    // ------------------------------------------------------
    // QUERY
    // ------------------------------------------------------

    const permissions =
      await Permission.find(
        query
      )
        .sort({
          module: 1,
          action: 1,
          name: 1,
        })
        .lean();

    return permissions;
  };


// ==========================================================
// GET PERMISSION
// ==========================================================

export const getPermission =
  async ({
    permissionId,
  } = {}) => {

    return findPermissionById(
      permissionId
    );
  };


// ==========================================================
// CREATE PERMISSION
// ==========================================================

export const createPermission =
  async ({
    key,
    name,
    description = "",
    module,
    action,

    // ------------------------------------------------------
    // AUDIT CONTEXT
    // ------------------------------------------------------
    //
    // Optional so existing callers do not immediately break.
    //
    // Controller should pass:
    //
    // audit: {
    //   userId,
    //   user,
    //   organizationId,
    //   ipAddress,
    //   userAgent,
    // }
    //

    audit = {},
  } = {}) => {

    const normalizedKey =
      normalizeKey(key);

    const normalizedName =
      String(
        name || ""
      ).trim();

    const normalizedDescription =
      String(
        description || ""
      ).trim();

    const normalizedModule =
      String(
        module || ""
      ).trim();

    const normalizedAction =
      String(
        action || ""
      ).trim();

    // ------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------

    if (!normalizedKey) {
      throw createError(
        "Permission key is required.",
        400
      );
    }

    if (!normalizedName) {
      throw createError(
        "Permission name is required.",
        400
      );
    }

    if (!normalizedModule) {
      throw createError(
        "Permission module is required.",
        400
      );
    }

    if (!normalizedAction) {
      throw createError(
        "Permission action is required.",
        400
      );
    }

    // ------------------------------------------------------
    // CHECK DUPLICATE
    // ------------------------------------------------------

    const existingPermission =
      await Permission.findOne({
        key:
          normalizedKey,
      });

    if (
      existingPermission
    ) {
      throw createError(
        "A permission with this key already exists.",
        409
      );
    }

    // ------------------------------------------------------
    // CREATE
    // ------------------------------------------------------

    const permission =
      await Permission.create({
        key:
          normalizedKey,

        name:
          normalizedName,

        description:
          normalizedDescription,

        module:
          normalizedModule,

        action:
          normalizedAction,

        isActive:
          true,
      });

    const createdPermission =
      await findPermissionById(
        permission._id
      );

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    await auditPermissionAction({
      action:
        "CREATE",

      permission:
        createdPermission,

      oldData:
        null,

      newData:
        createdPermission,

      description:
        `Permission "${createdPermission.key}" created.`,

      audit,
    });

    return createdPermission;
  };


// ==========================================================
// UPDATE PERMISSION
// ==========================================================

export const updatePermission =
  async ({
    permissionId,
    name,
    description,
    module,
    action,

    // Audit context
    audit = {},
  } = {}) => {

    const permission =
      await findPermissionById(
        permissionId
      );

    const update = {};

    // ------------------------------------------------------
    // NAME
    // ------------------------------------------------------

    if (
      name !== undefined
    ) {
      const value =
        String(
          name || ""
        ).trim();

      if (!value) {
        throw createError(
          "Permission name cannot be empty.",
          400
        );
      }

      update.name =
        value;
    }

    // ------------------------------------------------------
    // DESCRIPTION
    // ------------------------------------------------------

    if (
      description !==
      undefined
    ) {
      update.description =
        String(
          description || ""
        ).trim();
    }

    // ------------------------------------------------------
    // MODULE
    // ------------------------------------------------------

    if (
      module !== undefined
    ) {
      const value =
        String(
          module || ""
        ).trim();

      if (!value) {
        throw createError(
          "Permission module cannot be empty.",
          400
        );
      }

      update.module =
        value;
    }

    // ------------------------------------------------------
    // ACTION
    // ------------------------------------------------------

    if (
      action !== undefined
    ) {
      const value =
        String(
          action || ""
        ).trim();

      if (!value) {
        throw createError(
          "Permission action cannot be empty.",
          400
        );
      }

      update.action =
        value;
    }

    // ------------------------------------------------------
    // NOTHING TO UPDATE
    // ------------------------------------------------------

    if (
      Object.keys(update).length ===
      0
    ) {
      return permission;
    }

    // ------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------

    const updatedPermission =
      await Permission.findByIdAndUpdate(
        permissionId,
        {
          $set:
            update,
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (
      !updatedPermission
    ) {
      throw createError(
        "Permission not found.",
        404
      );
    }

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    await auditPermissionAction({
      action:
        "UPDATE",

      permission:
        updatedPermission,

      oldData:
        permission,

      newData:
        updatedPermission,

      description:
        `Permission "${updatedPermission.key}" updated.`,

      audit,
    });

    return updatedPermission;
  };


// ==========================================================
// UPDATE PERMISSION STATUS
// ==========================================================

export const updatePermissionStatus =
  async ({
    permissionId,
    isActive,

    // Audit context
    audit = {},
  } = {}) => {

    const permission =
      await findPermissionById(
        permissionId
      );

    if (
      typeof isActive !==
      "boolean"
    ) {
      throw createError(
        "isActive must be a boolean.",
        400
      );
    }

    // ------------------------------------------------------
    // NO CHANGE
    // ------------------------------------------------------

    if (
      permission.isActive ===
      isActive
    ) {
      return permission;
    }

    // ------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------

    const updatedPermission =
      await Permission.findByIdAndUpdate(
        permissionId,
        {
          $set: {
            isActive,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (
      !updatedPermission
    ) {
      throw createError(
        "Permission not found.",
        404
      );
    }

    // ------------------------------------------------------
    // AUDIT ACTION
    // ------------------------------------------------------

    const auditAction =
      isActive
        ? "ACTIVATE"
        : "DEACTIVATE";

    const statusText =
      isActive
        ? "activated"
        : "deactivated";

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    await auditPermissionAction({
      action:
        auditAction,

      permission:
        updatedPermission,

      oldData:
        permission,

      newData:
        updatedPermission,

      description:
        `Permission "${updatedPermission.key}" ${statusText}.`,

      audit,
    });

    return updatedPermission;
  };


// ==========================================================
// DELETE PERMISSION
// ==========================================================

export const deletePermission =
  async ({
    permissionId,

    // Audit context
    audit = {},
  } = {}) => {

    const permission =
      await findPermissionById(
        permissionId
      );

    // ------------------------------------------------------
    // CHECK ROLE REFERENCES
    // ------------------------------------------------------

    const roleUsingPermission =
      await Role.findOne({
        permissions:
          permission._id,
      })
        .select(
          "_id name displayName"
        )
        .lean();

    if (
      roleUsingPermission
    ) {
      throw createError(
        `Permission cannot be deleted because it is assigned to role "${roleUsingPermission.displayName || roleUsingPermission.name}". Deactivate the permission instead.`,
        409
      );
    }

    // ------------------------------------------------------
    // DELETE
    // ------------------------------------------------------

    await Permission.findByIdAndDelete(
      permissionId
    );

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------
    //
    // Important:
    //
    // The permission no longer exists in MongoDB, therefore
    // the audit record keeps the complete deleted permission
    // in oldData.
    //

    await auditPermissionAction({
      action:
        "DELETE",

      permission:
        permission,

      oldData:
        permission,

      newData:
        null,

      description:
        `Permission "${permission.key}" deleted.`,

      audit,
    });

    return {
      success:
        true,

      message:
        "Permission deleted successfully.",
    };
  };

