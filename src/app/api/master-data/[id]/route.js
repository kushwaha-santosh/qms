import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";
import User from "@/models/User.js";

import {
  getMasterDataById,
  updateMasterData,
  updateMasterDataStatus,
  deleteMasterData,
} from "@/services/masterData/masterData.service.js";

const PERMISSIONS = {
  VIEW: "MASTER_DATA_VIEW",
  UPDATE: "MASTER_DATA_UPDATE",
  DELETE: "MASTER_DATA_DELETE",
  STATUS_UPDATE: "MASTER_DATA_STATUS_UPDATE",
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

const getId = async (params) => {
  return (await params)?.id;
};

/* ==========================================================
 * GET ONE MASTER DATA RECORD
 * ========================================================== */

export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.VIEW);

    const id = await getId(params);

    const data = await getMasterDataById({
      user,
      id,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get master data item error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load master data.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}

/* ==========================================================
 * UPDATE MASTER DATA
 *
 * Normal update:
 * PUT /api/master-data/:id
 *
 * Status-only update:
 * {
 *   "isActive": true
 * }
 * ========================================================== */

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const body = await request.json();

    const id = await getId(params);

    /*
     * If the request contains ONLY isActive,
     * treat it as a status update.
     */
    if (body?.isActive !== undefined && Object.keys(body).length === 1) {
      await authorizePermission(user, PERMISSIONS.STATUS_UPDATE);

      const data = await updateMasterDataStatus({
        user,
        id,
        isActive: body.isActive,
        request,
      });

      return NextResponse.json({
        success: true,
        message: "Master data status updated successfully.",
        data,
      });
    }

    /*
     * Normal update.
     */
    await authorizePermission(user, PERMISSIONS.UPDATE);

    const data = await updateMasterData({
      user,
      id,
      data: body,
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Master data updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update master data error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to update master data.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}

/* ==========================================================
 * DELETE MASTER DATA
 * ========================================================== */

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.DELETE);

    const id = await getId(params);

    await deleteMasterData({
      user,
      id,
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Master data deleted successfully.",
    });
  } catch (error) {
    console.error("Delete master data error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to delete master data.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}
