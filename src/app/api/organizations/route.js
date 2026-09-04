
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
  listOrganizations,
  createOrganization,
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
 * GET /api/organizations
 *
 * SUPER_ADMIN:
 *   Returns all organizations.
 *
 * ORG_ADMIN:
 *   Returns only their own organization.
 * ========================================================== */

export async function GET(
  request
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

    const organizations =
      await listOrganizations({
        user,
      });

    return NextResponse.json(
      {
        success: true,
        data: organizations,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "List organizations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to retrieve organizations.",
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
 * POST /api/organizations
 *
 * SUPER_ADMIN only.
 *
 * Creates:
 *   1. Organization
 *   2. First ORG_ADMIN
 *
 * The service handles the transaction and audit log.
 * ========================================================== */

export async function POST(
  request
) {
  try {
    await connectDB();

    const user =
      await loadAuthenticatedUser(
        request
      );

    await authorizePermission(
      user,
      PERMISSIONS.ORGANIZATION_CREATE
    );

    const body =
      await request.json();

    const result =
      await createOrganization({
        user,
        data: body,
        request,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Organization created successfully.",
        data: result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create organization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to create organization.",
      },
      {
        status:
          error?.statusCode ||
          500,
      }
    );
  }
}

