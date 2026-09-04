
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

// Make sure referenced schemas are registered.
import "@/models/Organization.js";
import "@/models/Role.js";
import "@/models/Permission.js";

import {
  getOrganization,
  updateOrganization,
  updateOrganizationStatus,
} from "@/services/organization/organization.service.js";

import { PERMISSIONS } from "@/lib/auth/permissions.js";

/* ==========================================================
 * LOAD AUTHENTICATED USER
 * ========================================================== */

const loadAuthenticatedUser = async (
  request
) => {
  const session =
    await getAuthSession(request);

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

/* ==========================================================
 * CHECK PERMISSION
 * ========================================================== */

const authorizePermission = async (
  user,
  permission
) => {
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
        "You do not have permission to perform this action."
      );

    error.statusCode = 403;

    throw error;
  }
};

/* ==========================================================
 * GET /api/organizations/:id
 *
 * SUPER_ADMIN:
 *   Can view any organization.
 *
 * Organization user:
 *   Can view only their own organization.
 * ========================================================== */

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

    await authorizePermission(
      user,
      PERMISSIONS.ORGANIZATION_VIEW
    );

    const resolvedParams =
      await params;

    const organizationId =
      resolvedParams?.id;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const organization =
      await getOrganization({
        user,
        organizationId,
      });

    return NextResponse.json(
      {
        success: true,
        data: organization,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get organization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to retrieve organization.",
      },
      {
        status:
          error?.statusCode ||
          500,
      }
    );
  }
}

/* ==========================================================
 * PATCH /api/organizations/:id
 *
 * Updates organization details.
 *
 * The service determines which fields the current role
 * is allowed to modify.
 * ========================================================== */

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

    await authorizePermission(
      user,
      PERMISSIONS.ORGANIZATION_UPDATE
    );

    const resolvedParams =
      await params;

    const organizationId =
      resolvedParams?.id;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const organization =
      await updateOrganization({
        user,
        organizationId,
        data: body,
        request,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Organization updated successfully.",
        data: organization,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update organization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to update organization.",
      },
      {
        status:
          error?.statusCode ||
          500,
      }
    );
  }
}

/* ==========================================================
 * PATCH STATUS
 *
 * /api/organizations/:id?status=...
 *
 * Body:
 * {
 *   "status": "ACTIVE"
 * }
 *
 * This is kept as a separate operation because the service
 * records STATUS_UPDATE separately from a normal UPDATE.
 * ========================================================== */

export async function PUT(
  request,
  { params }
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    await authorizePermission(
      user,
      PERMISSIONS.ORGANIZATION_STATUS_UPDATE
    );

    const resolvedParams =
      await params;

    const organizationId =
      resolvedParams?.id;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const status =
      body?.status;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization status is required.",
        },
        {
          status: 400,
        }
      );
    }

    const organization =
      await updateOrganizationStatus({
        user,
        organizationId,
        status,
        request,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Organization status updated successfully.",
        data: organization,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update organization status error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to update organization status.",
      },
      {
        status:
          error?.statusCode ||
          500,
      }
    );
  }
}

