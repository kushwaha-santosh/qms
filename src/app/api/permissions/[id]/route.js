import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  getAuthSession,
} from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import "@/models/Permission.js";
import "@/models/Role.js";

import {
  getPermission,
  updatePermission,
  updatePermissionStatus,
  deletePermission,
} from "@/services/permissions/permission.service.js";

import {
  getRequestMetadata,
  getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// LOAD USER
// ==========================================================

const loadAuthenticatedUser =
  async (request) => {
    const session =
      await getAuthSession(
        request
      );

    if (!session?.userId) {
      const error =
        new Error(
          "Authentication required."
        );

      error.statusCode = 401;

      throw error;
    }

    const user =
      await User.findById(
        session.userId
      )
        .select("-password")
        .lean();

    if (!user) {
      const error =
        new Error(
          "User account no longer exists."
        );

      error.statusCode = 401;

      throw error;
    }

    if (
      user.status !==
      "ACTIVE"
    ) {
      const error =
        new Error(
          "User account is not active."
        );

      error.statusCode = 403;

      throw error;
    }

    return user;
  };

// ==========================================================
// AUTHORIZE
// ==========================================================

const authorize =
  async (
    user,
    permission
  ) => {
    // SUPER_ADMIN has global access.

    if (
      user.role ===
      "SUPER_ADMIN"
    ) {
      return;
    }

    const {
      role,
      permissions,
    } =
      await getAuthorizationContext(
        user
      );

    if (!role) {
      const error =
        new Error(
          "User role is not configured or inactive."
        );

      error.statusCode = 403;

      throw error;
    }

    if (
      !userHasPermission(
        permissions,
        permission
      )
    ) {
      const error =
        new Error(
          `You do not have permission to perform this action. Required permission: ${permission}`
        );

      error.statusCode = 403;

      throw error;
    }
  };

// ==========================================================
// PARAMETER
// ==========================================================

const getPermissionId =
  async (params) => {
    const resolved =
      await params;

    return resolved?.id;
  };

// ==========================================================
// BUILD AUDIT CONTEXT
// ==========================================================
// ==========================================================
// BUILD AUDIT CONTEXT
// ==========================================================

const getAuditContext =
  (
    request,
    user
  ) => {
    const forwardedFor =
      request.headers.get(
        "x-forwarded-for"
      );

    const realIp =
      request.headers.get(
        "x-real-ip"
      );

    const ipAddress =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      realIp ||
      "";

    const userAgent =
      request.headers.get(
        "user-agent"
      ) || "";

    return {
      userId:
        user?._id,

      user,

      organizationId:
        user?.organizationId,

      ipAddress,

      userAgent,
    };
  };
// ==========================================================
// GET
// ==========================================================

export async function GET(
  request,
  { params }
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    await authorize(
      user,
      "PERMISSION_VIEW"
    );

    const permissionId =
      await getPermissionId(
        params
      );

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Permission ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const permission =
      await getPermission({
        permissionId,
      });

    return NextResponse.json(
      {
        success: true,

        data: {
          permission,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get permission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Unable to retrieve permission.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}

// ==========================================================
// PATCH
// ==========================================================
// ==========================================================
// PATCH
// ==========================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    const permissionId =
      await getPermissionId(
        params
      );

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const audit =
      getAuditContext(
        request,
        user
      );

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (
      body?.isActive !==
      undefined
    ) {
      await authorize(
        user,
        "PERMISSION_UPDATE"
      );

      const permission =
        await updatePermissionStatus({
          permissionId,

          isActive:
            body.isActive,

          audit,
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Permission status updated successfully.",

          data: {
            permission,
          },
        },
        {
          status: 200,
        }
      );
    }

    // ------------------------------------------------------
    // DETAILS
    // ------------------------------------------------------

    await authorize(
      user,
      "PERMISSION_UPDATE"
    );

    const permission =
      await updatePermission({
        permissionId,

        ...body,

        audit,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Permission updated successfully.",

        data: {
          permission,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update permission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Unable to update permission.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}

// ==========================================================
// DELETE
// ==========================================================
// ==========================================================
// DELETE
// ==========================================================

export async function DELETE(
  request,
  { params }
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    await authorize(
      user,
      "PERMISSION_DELETE"
    );

    const permissionId =
      await getPermissionId(
        params
      );

    if (!permissionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const audit =
      getAuditContext(
        request,
        user
      );

    const result =
      await deletePermission({
        permissionId,

        audit,
      });

    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Delete permission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Unable to delete permission.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}