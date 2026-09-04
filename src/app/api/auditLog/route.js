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
  getAuditLogs,
} from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// LOAD AUTHENTICATED USER
// ==========================================================

const loadAuthenticatedUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    const error = new Error(
      "Authentication required."
    );

    error.statusCode = 401;

    throw error;
  }

  const user = await User.findById(
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

  if (user.role === "SUPER_ADMIN") {
    return;
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  const {
    role,
    permissions,
  } = await getAuthorizationContext(user);

  if (!role) {
    const error = new Error(
      "User role is not configured or inactive."
    );

    error.statusCode = 403;

    throw error;
  }

  const allowed = userHasPermission(
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

const getOrganizationId = (user) => {
  return (
    user?.organizationId?._id ||
    user?.organizationId ||
    null
  );
};

// ==========================================================
// GET /api/auditLogs
// ==========================================================

export async function GET(request) {
  try {
    await connectDB();

    // ------------------------------------------------------
    // USER
    // ------------------------------------------------------

    const user =
      await loadAuthenticatedUser(request);

    // ------------------------------------------------------
    // AUTHORIZATION
    // ------------------------------------------------------

    await authorize(
      user,
      "AUDIT_VIEW"
    );

    // ------------------------------------------------------
    // QUERY PARAMETERS
    // ------------------------------------------------------

    const params =
      request.nextUrl.searchParams;

    const module =
      params.get("module") || "";

    const action =
      params.get("action") || "";

    const userId =
      params.get("userId") || "";

    const recordId =
      params.get("recordId") || "";

    const search =
      params.get("search") || "";

    const startDate =
      params.get("startDate") || "";

    const endDate =
      params.get("endDate") || "";

    const page =
      Number(params.get("page")) || 1;

    const limit =
      Number(params.get("limit")) || 20;

    // ------------------------------------------------------
    // ORGANIZATION FILTER
    // ------------------------------------------------------

    const targetOrganizationId =
      params.get("organizationId") || null;

    const isSuperAdmin =
      user.role === "SUPER_ADMIN";

    // ------------------------------------------------------
    // CURRENT USER ORGANIZATION
    // ------------------------------------------------------

    const organizationId =
      getOrganizationId(user);

    // ------------------------------------------------------
    // GET AUDIT LOGS
    // ------------------------------------------------------

    const result =
      await getAuditLogs({
        organizationId,

        isSuperAdmin,

        targetOrganizationId,

        module,
        action,

        userId,
        recordId,

        search,

        startDate,
        endDate,

        page,
        limit,
      });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          auditLogs:
            result?.auditLogs || [],

          pagination:
            result?.pagination || {
              total: 0,
              page,
              limit,
              totalPages: 1,
            },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "List audit logs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Unable to retrieve audit logs.",
      },
      {
        status:
          error?.statusCode || 500,
      }
    );
  }
}