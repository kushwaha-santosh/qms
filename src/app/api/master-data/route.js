import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";
import { MASTER_DATA_TYPES } from "@/models/MasterData.js";

import {
  listMasterData,
  createMasterData,
} from "@/services/masterData/masterData.service.js";

const PERMISSIONS = {
  VIEW: "MASTER_DATA_VIEW",
  CREATE: "MASTER_DATA_CREATE",
};

const loadAuthenticatedUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(session.userId).select("-password").lean();

  if (!user) {
    const error = new Error("User account no longer exists.");

    error.statusCode = 401;

    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("User account is not active.");

    error.statusCode = 403;

    throw error;
  }

  return user;
};

const authorizePermission = async (user, permission) => {
  const { role, permissions } = await getAuthorizationContext(user);

  if (!role) {
    const error = new Error("User role is not configured or inactive.");

    error.statusCode = 403;

    throw error;
  }

  if (!userHasPermission(permissions, permission)) {
    const error = new Error(
      "You do not have permission to perform this action.",
    );

    error.statusCode = 403;

    throw error;
  }
};

/* ==========================================================
 * GET
 * ========================================================== */

export async function GET(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.VIEW);

    const url = new URL(request.url);

    const type = url.searchParams.get("type") || "";

    const organizationId = url.searchParams.get("organizationId") || null;

    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const search = url.searchParams.get("search") || "";

    const page = Number.parseInt(url.searchParams.get("page") || "1", 10) || 1;

    const limit =
      Number.parseInt(url.searchParams.get("limit") || "10", 10) || 10;

    /*
     * ========================================================
     * MASTER DATA TYPES
     * ========================================================
     *
     * No type means the client is requesting the list
     * of available master data types from the database/model.
     */

    if (!type) {
      return NextResponse.json({
        success: true,
        data: MASTER_DATA_TYPES,
      });
    }

    const result = await listMasterData({
      user,
      type,
      organizationId,
      includeInactive,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get master data error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to load master data.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}

/* ==========================================================
 * POST
 * ========================================================== */

export async function POST(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.CREATE);

    const body = await request.json();

    const data = await createMasterData({
      user,
      data: body,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Master data created successfully.",
        data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create master data error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to create master data.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}
