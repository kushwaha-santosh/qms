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
  updateRoleStatus,
} from "@/services/roles/role.service.js";

import { PERMISSIONS } from "@/lib/auth/permissions.js";


// ==========================================================
// PATCH /api/roles/:roleId/status
// ==========================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    // ======================================================
    // AUTHENTICATION
    // ======================================================

    const session =
      await getAuthSession(
        request
      );

    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // ======================================================
    // USER
    // ======================================================

    const user =
      await User.findById(
        session.userId
      )
        .select("-password")
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account no longer exists.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      user.status !==
      "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account is not active.",
        },
        {
          status: 403,
        }
      );
    }

    // ======================================================
    // RBAC
    // ======================================================

    const {
      role,
      permissions,
    } =
      await getAuthorizationContext(
        user
      );

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User role is not configured or inactive.",
        },
        {
          status: 403,
        }
      );
    }

    const canUpdate =
      userHasPermission(
        permissions,
        PERMISSIONS.ROLE_UPDATE
      );

    if (!canUpdate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to update role status.",
        },
        {
          status: 403,
        }
      );
    }

    // ======================================================
    // BODY
    // ======================================================

    const body =
      await request.json();

    if (
      typeof body?.isActive !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "isActive must be a boolean.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // UPDATE
    // ======================================================

    const resolvedParams = await params;
    const roleId = resolvedParams?.roleId;

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Role ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedRole =
      await updateRoleStatus({
        user,
        roleId,
        isActive: body.isActive,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Role status updated successfully.",

        data: {
          role:
            updatedRole,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update role status error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to update role status.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}