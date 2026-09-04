import { NextResponse } from "next/server";

import { requireAuth, requirePermission } from "@/lib/auth/requireAuth.js";

import {
  getAuditById,
  updateAudit,
  deleteAudit,
} from "@/services/audit/audit.service";

// ==========================================================
// GET /api/audits/:id
// ==========================================================

export async function GET(request, { params }) {
  try {
    const authentication = await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    const routeParams = await params;

    const audit = await getAuditById({
      user,
      id: routeParams?.id,
    });

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (error) {
    console.error("GET /api/audits/:id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load audit.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}

// ==========================================================
// PUT /api/audits/:id
// ==========================================================

export async function PUT(request, { params }) {
  try {
    const authorization = await requirePermission(request, "AUDIT_UPDATE");

    if (!authorization.success) {
      return authorization.response;
    }

    const { user } = authorization;

    const routeParams = await params;

    const body = await request.json();

    const audit = await updateAudit({
      user,
      id: routeParams?.id,
      data: {
        ...body,
        request,
      },
    });

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (error) {
    console.error("PUT /api/audits/:id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to update audit.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}

// ==========================================================
// DELETE /api/audits/:id
// ==========================================================

export async function DELETE(request, { params }) {
  try {
    const authorization = await requirePermission(request, "AUDIT_DELETE");

    if (!authorization.success) {
      return authorization.response;
    }

    const { user } = authorization;

    const routeParams = await params;

    const result = await deleteAudit({
      user,
      id: routeParams?.id,
      request,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/audits/:id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to delete audit.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}
