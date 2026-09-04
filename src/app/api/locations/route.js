import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import { getAuthSession } from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import {
  listLocations,
  createLocation,
} from "@/services/location/location.service.js";

const PERMISSIONS = {
  VIEW: "LOCATION_VIEW",
  CREATE: "LOCATION_CREATE",
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

/*
 * ==========================================================
 * AUTHENTICATED USER
 * ==========================================================
 */

const loadAuthenticatedUser = async (request) => {
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

/*
 * ==========================================================
 * PERMISSION
 * ==========================================================
 */

const authorizePermission = async (user, permission) => {
  /*
   * SUPER_ADMIN bypasses application permissions.
   */

  if (user?.role === "SUPER_ADMIN") {
    return;
  }

  const { role, permissions } = await getAuthorizationContext(user);

  if (!role) {
    throw createError("User role is not configured or inactive.", 403);
  }

  if (!userHasPermission(permissions, permission)) {
    throw createError(
      "You do not have permission to perform this action.",
      403,
    );
  }
};

/*
 * ==========================================================
 * GET
 * ==========================================================
 */

export async function GET(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.VIEW);

    const url = new URL(request.url);

    const type = url.searchParams.get("type") || "COUNTRY";

    const parentId = url.searchParams.get("parentId") || null;

    const search = url.searchParams.get("search") || "";

    const isActiveParam = url.searchParams.get("isActive");

    const page = Number(url.searchParams.get("page") || 1);

    const limit = Number(url.searchParams.get("limit") || 20);

    const isActive = isActiveParam === null ? true : isActiveParam;

    const result = await listLocations({
      user,
      type,
      parentId,
      search,
      isActive,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,

      data: result.locations,

      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get locations error:", error);

    return NextResponse.json(
      {
        success: false,

        message: error.message || "Unable to load locations.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}

/*
 * ==========================================================
 * POST
 * ==========================================================
 */

export async function POST(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.CREATE);

    const body = await request.json();

    const location = await createLocation({
      user,
      data: body,
      request,
    });

    return NextResponse.json(
      {
        success: true,

        message: "Location created successfully.",

        data: location,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create location error:", error);

    return NextResponse.json(
      {
        success: false,

        message: error.message || "Unable to create location.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}
