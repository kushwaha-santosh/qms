import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";
import { PERMISSIONS } from "@/lib/auth/permissions.js";
import User from "@/models/User.js";

import "@/models/Organization.js";
import "@/models/Role.js";
import "@/models/Permission.js";

import {
  listNCRs,
  getNCRById,
  createNCR,
  updateNCR,
  deleteNCR,
  assignNCR,
  updateNCRStatus,
  getNCRStatusWorkflow,
} from "@/services/ncr/ncr.service.js";

const loadAuthenticatedUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(session.userId)
    .select("-password")
    .lean();

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
    const error = new Error("You do not have permission to perform this action.");
    error.statusCode = 403;
    throw error;
  }
};

const getOrganizationIdFromQuery = (request) =>
  new URL(request.url).searchParams.get("organizationId") || null;

const parseBody = async (request) => {
  try {
    return await request.json();
  } catch {
    const error = new Error("Invalid JSON request body.");
    error.statusCode = 400;
    throw error;
  }
};

const getErrorStatus = (error) => {
  if (error?.name === "ValidationError") return 400;
  if (error?.name === "CastError") return 400;
  if (error?.code === 11000) return 409;
  return error?.statusCode || 500;
};

const jsonError = (error, fallback) =>
  NextResponse.json(
    {
      success: false,
      message: error?.message || fallback,
    },
    { status: getErrorStatus(error) },
  );

export async function GET(request) {
  try {
    await connectDB();
    const user = await loadAuthenticatedUser(request);
    await authorizePermission(user, PERMISSIONS.NCR_VIEW);

    const url = new URL(request.url);
    const params = url.searchParams;
    const organizationId = params.get("organizationId") || null;

    const requestedId = params.get("id");

    if (requestedId) {
      const result = await getNCRById({
        user,
        ncrId: requestedId,
        organizationId,
      });
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    const result = await listNCRs({
      user,
      organizationId,
      search: params.get("search") || "",
      status: params.get("status") || "",
      severity: params.get("severity") || "",
      source: params.get("source") || "",
      category: params.get("category") || "",
      department: params.get("department") || "",
      process: params.get("process") || "",
      assignedTo: params.get("assignedTo") || "",
      reportedBy: params.get("reportedBy") || "",
      page: params.get("page") || 1,
      limit: params.get("limit") || 20,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("GET /api/ncr error:", error);
    return jsonError(error, "Unable to retrieve NCRs.");
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await loadAuthenticatedUser(request);
    await authorizePermission(user, PERMISSIONS.NCR_CREATE);

    const body = await parseBody(request);
    const requestedOrganizationId =
      body?.organizationId || getOrganizationIdFromQuery(request);

    // Never trust reportedBy / createdBy / updatedBy from the browser.
    // The service derives them from the authenticated user.
    const { organizationId: ignoredOrganizationId, reportedBy, createdBy, updatedBy, ...data } = body || {};
    void ignoredOrganizationId;
    void reportedBy;
    void createdBy;
    void updatedBy;

    const result = await createNCR({
      user,
      organizationId: requestedOrganizationId,
      data,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "NCR created successfully.",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/ncr error:", error);
    return jsonError(error, "Unable to create NCR.");
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await loadAuthenticatedUser(request);
    const body = await parseBody(request);
    const url = new URL(request.url);
    const ncrId = url.searchParams.get("id") || body?.ncrId;
    const organizationId = body?.organizationId || url.searchParams.get("organizationId") || null;
    const action = String(body?.action || "UPDATE").toUpperCase();

    if (action === "STATUS") {
      await authorizePermission(user, PERMISSIONS.NCR_STATUS_UPDATE);
      const result = await updateNCRStatus({
        user,
        ncrId,
        status: body?.status,
        comment: body?.comment || "",
        organizationId,
        request,
      });
      return NextResponse.json({ success: true, message: "NCR status updated successfully.", data: result });
    }

    if (action === "ASSIGN") {
      await authorizePermission(user, PERMISSIONS.NCR_UPDATE);
      const result = await assignNCR({
        user,
        ncrId,
        assignedTo: body?.assignedTo,
        organizationId,
        request,
      });
      return NextResponse.json({ success: true, message: "NCR assigned successfully.", data: result });
    }

    await authorizePermission(user, PERMISSIONS.NCR_UPDATE);

    const { ncrId: ignoredNcrId, organizationId: ignoredOrganizationId, action: ignoredAction, ...data } = body || {};
    void ignoredNcrId;
    void ignoredOrganizationId;
    void ignoredAction;

    const result = await updateNCR({
      user,
      ncrId,
      data,
      organizationId,
      request,
    });

    return NextResponse.json({ success: true, message: "NCR updated successfully.", data: result });
  } catch (error) {
    console.error("PATCH /api/ncr error:", error);
    return jsonError(error, "Unable to update NCR.");
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await loadAuthenticatedUser(request);
    await authorizePermission(user, PERMISSIONS.NCR_DELETE);

    const url = new URL(request.url);
    const ncrId = url.searchParams.get("id");
    const organizationId = url.searchParams.get("organizationId") || null;

    const result = await deleteNCR({ user, ncrId, organizationId, request });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/ncr error:", error);
    return jsonError(error, "Unable to delete NCR.");
  }
}

export async function OPTIONS() {
  return NextResponse.json({ success: true });
}

// Exported for any internal route/test that imports the workflow helper.
export { getNCRStatusWorkflow };
