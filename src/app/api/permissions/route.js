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

import {
  listPermissions,
  createPermission,
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
    // SUPER_ADMIN has global permission
    // management access.

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

    const allowed =
      userHasPermission(
        permissions,
        permission
      );

    if (!allowed) {
      const error =
        new Error(
          `You do not have permission to perform this action. Required permission: ${permission}`
        );

      error.statusCode = 403;

      throw error;
    }
  };

// ==========================================================
// BUILD AUDIT CONTEXT
// ==========================================================
//
// The API route is responsible for knowing:
// - authenticated user
// - organization
// - request IP
// - user agent
//
// The service is responsible for:
// - database operation
// - audit creation
//
// ==========================================================

const buildAuditContext =
  (
    user,
    request
  ) => {
    const actor =
      getAuditActorContext(
        user
      );

    const metadata =
      getRequestMetadata(
        request
      );

    return {
      userId:
        actor.userId,

      organizationId:
        actor.organizationId,

      user:
        user,

      userName:
        actor.userName,

      userEmail:
        actor.userEmail,

      ipAddress:
        metadata.ipAddress,

      userAgent:
        metadata.userAgent,
    };
  };

// ==========================================================
// GET /api/permissions
// ==========================================================

export async function GET(
  request
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

    const params =
      Object.fromEntries(
        request.nextUrl
          .searchParams
      );

    const permissions =
      await listPermissions(
        params
      );

    return NextResponse.json(
      {
        success: true,

        data: {
          permissions,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "List permissions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Unable to retrieve permissions.",
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
// POST /api/permissions
// ==========================================================
// ==========================================================
// POST /api/permissions
// ==========================================================

export async function POST(
  request
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    await authorize(
      user,
      "PERMISSION_CREATE"
    );

    const body =
      await request.json();

    // ------------------------------------------------------
    // REQUEST INFORMATION
    // ------------------------------------------------------

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

    // ------------------------------------------------------
    // CREATE PERMISSION
    // ------------------------------------------------------

    const permission =
      await createPermission({
        ...(body || {}),

        audit: {
          userId:
            user._id,

          user,

          organizationId:
            user.organizationId,

          ipAddress,

          userAgent,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Permission created successfully.",

        data: {
          permission,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create permission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Unable to create permission.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}