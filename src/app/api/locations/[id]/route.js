import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import { getAuthSession } from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import {
  getLocationById,
  updateLocation,
  deleteLocation,
} from "@/services/location/location.service.js";

const PERMISSIONS = {
  VIEW: "LOCATION_VIEW",
  UPDATE: "LOCATION_UPDATE",
  DELETE: "LOCATION_DELETE",
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const loadUser = async (request) => {
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

const authorize = async (user, permission) => {
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

export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await loadUser(request);

    await authorize(user, PERMISSIONS.VIEW);

    // Next.js App Router params can be async
    const { id } = await params;

    const location = await getLocationById({
      user,
      id,
    });

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to load location.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await loadUser(request);

    await authorize(user, PERMISSIONS.UPDATE);

    // Next.js App Router params can be async
    const { id } = await params;

    const body = await request.json();

    const location = await updateLocation({
      user,
      id,
      data: body,
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Location updated successfully.",
      data: location,
    });
  } catch (error) {
    console.error("Update location error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to update location.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const user = await loadUser(request);

    await authorize(user, PERMISSIONS.DELETE);

    // Next.js App Router params can be async
    const { id } = await params;

    await deleteLocation({
      user,
      id,
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully.",
    });
  } catch (error) {
    console.error("Delete location error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to delete location.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}
