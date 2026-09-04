import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  requirePermission,
} from "@/lib/auth/requireAuth.js";

import {
  PERMISSIONS,
} from "@/lib/auth/permissions.js";

import {
  updateOrganizationStatus,
} from "@/services/organization/organization.service.js";

export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    const authorization =
      await requirePermission(
        request,
        PERMISSIONS.ORGANIZATION_UPDATE
      );

    if (!authorization.success) {
      return authorization.response;
    }

    if (
      authorization.user.role !==
      "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only SUPER_ADMIN can change organization status.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const body =
      await request.json();

    const organization =
      await updateOrganizationStatus({
        user: authorization.user,
        organizationId: id,
        status: body?.status,
      });

    return NextResponse.json({
      success: true,
      message:
        "Organization status updated successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    console.error(
      "Organization status error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to update organization status.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}