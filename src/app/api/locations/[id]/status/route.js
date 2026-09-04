import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import { getAuthSession } from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import { updateLocationStatus } from "@/services/location/location.service.js";

const PERMISSION = "LOCATION_STATUS_UPDATE";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const getUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    throw createError("Authentication required.", 401);
  }

  const user = await User.findById(session.userId).select("-password").lean();

  if (!user) {
    throw createError("User account no longer exists.", 401);
  }

  if (user.status !== "ACTIVE") {
    throw createError("User account is not active.", 403);
  }

  return user;
};

const authorize = async (user) => {
  if (user?.role === "SUPER_ADMIN") {
    return;
  }

  const { role, permissions } = await getAuthorizationContext(user);

  if (!role) {
    throw createError("User role is not configured or inactive.", 403);
  }

  if (!userHasPermission(permissions, PERMISSION)) {
    throw createError(
      "You do not have permission to update location status.",
      403,
    );
  }
};

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const user = await getUser(request);

    await authorize(user);
    // Next.js App Router params can be async
    const { id } = await params;

    const body = await request.json();

    if (typeof body?.isActive !== "boolean") {
      throw createError("isActive must be a boolean.", 400);
    }

    const location = await updateLocationStatus({
      user,
      id: id,
      isActive: body.isActive,
      request,
    });

    return NextResponse.json({
      success: true,

      message: "Location status updated successfully.",

      data: location,
    });
  } catch (error) {
    console.error("Location status error:", error);

    return NextResponse.json(
      {
        success: false,

        message: error.message || "Unable to update location status.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}
