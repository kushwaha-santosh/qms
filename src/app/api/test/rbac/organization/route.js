import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  requireAuth,
} from "@/lib/auth/requireAuth.js";

import {
  canAccessOrganization,
  resolveOrganizationId,
} from "@/lib/auth/organization.js";

export async function GET(request) {
  try {
    await connectDB();

    const authentication =
      await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    const { searchParams } =
      new URL(request.url);

    const requestedOrganizationId =
      searchParams.get(
        "organizationId"
      );

    // ------------------------------------------------------
    // Resolve target organization
    // ------------------------------------------------------

    const organizationId =
      resolveOrganizationId(
        user,
        requestedOrganizationId
      );

    // ------------------------------------------------------
    // SUPER_ADMIN without organization
    // ------------------------------------------------------

    if (
      user.role === "SUPER_ADMIN" &&
      !organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SUPER_ADMIN must specify an organizationId.",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------------
    // Organization access check
    // ------------------------------------------------------

    if (
      !canAccessOrganization(
        user,
        organizationId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have access to this organization.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Organization isolation is working.",
      data: {
        userId: user._id,
        role: user.role,
        userOrganizationId:
          user.organizationId?._id ||
          user.organizationId ||
          null,
        requestedOrganizationId:
          requestedOrganizationId || null,
        resolvedOrganizationId:
          organizationId,
        globalUser:
          user.role === "SUPER_ADMIN",
      },
    });
  } catch (error) {
    console.error(
      "Organization isolation test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Organization isolation test failed.",
      },
      {
        status: 500,
      }
    );
  }
}