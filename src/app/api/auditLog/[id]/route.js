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
  getAuditLogById,
} from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// LOAD AUTHENTICATED USER
// ==========================================================

const loadAuthenticatedUser = async (request) => {
  const session =
    await getAuthSession(request);

  if (!session?.userId) {
    const error = new Error(
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
    const error = new Error(
      "User account no longer exists."
    );

    error.statusCode = 401;

    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error(
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

const authorize = async (
  user,
  permission
) => {
  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  if (
    user.role === "SUPER_ADMIN"
  ) {
    return;
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  const {
    role,
    permissions,
  } =
    await getAuthorizationContext(
      user
    );

  if (!role) {
    const error = new Error(
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
    const error = new Error(
      `You do not have permission to perform this action. Required permission: ${permission}`
    );

    error.statusCode = 403;

    throw error;
  }
};

// ==========================================================
// GET ORGANIZATION ID
// ==========================================================

const getOrganizationId = (
  user
) => {
  return (
    user?.organizationId?._id ||
    user?.organizationId ||
    null
  );
};

// ==========================================================
// GET /api/auditLogs/[id]
// ==========================================================

export async function GET(
  request,
  { params }
) {
  try {
    await connectDB();

    // ------------------------------------------------------
    // USER
    // ------------------------------------------------------

    const user =
      await loadAuthenticatedUser(
        request
      );

    // ------------------------------------------------------
    // AUTHORIZATION
    // ------------------------------------------------------

    await authorize(
      user,
      "AUDIT_VIEW"
    );

    // ------------------------------------------------------
    // PARAMS
    // ------------------------------------------------------

    const resolvedParams =
      await params;

    const auditLogId =
      resolvedParams?.id;

    if (!auditLogId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Audit log ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------------
    // CONTEXT
    // ------------------------------------------------------

    const isSuperAdmin =
      user.role ===
      "SUPER_ADMIN";

    const organizationId =
      getOrganizationId(
        user
      );

    // ------------------------------------------------------
    // GET AUDIT LOG
    // ------------------------------------------------------

    const auditLog =
      await getAuditLogById({
        auditLogId,

        organizationId,

        isSuperAdmin,
      });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          auditLog,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get audit log error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Unable to retrieve audit log.",
      },
      {
        status:
          error?.statusCode ||
          500,
      }
    );
  }
}