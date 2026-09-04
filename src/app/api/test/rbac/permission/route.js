import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  requirePermission,
} from "@/lib/auth/requireAuth.js";

import {
  PERMISSIONS,
} from "@/lib/auth/permissions.js";

import {
  getPermissionKeys,
} from "@/lib/auth/authorization.js";

export async function GET(request) {
  try {
    await connectDB();

    const result =
      await requirePermission(
        request,
        PERMISSIONS.USER_VIEW
      );

    if (!result.success) {
      return result.response;
    }

    return NextResponse.json({
      success: true,
      message:
        "Permission authorization is working.",
      data: {
        userId: result.user._id,
        email: result.user.email,
        role: result.user.role,
        organizationId:
          result.user.organizationId?._id ||
          result.user.organizationId ||
          null,
        permissions:
          getPermissionKeys(
            result.permissions
          ),
        requiredPermission:
          PERMISSIONS.USER_VIEW,
      },
    });
  } catch (error) {
    console.error(
      "Permission test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Permission test failed.",
      },
      {
        status: 500,
      }
    );
  }
}