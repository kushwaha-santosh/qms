import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requireAuth.js";

import { getAuditAuditLogs } from "@/services/audit/audit.service.js";

// ==========================================================
// GET /api/audits/:id/audit-logs
// ==========================================================

export async function GET(request, context) {
  try {
    const auth = await requirePermission(request, "AUDIT_VIEW");

    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;

    const params = await context.params;

    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Audit ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page")) || 1;

    const limit = Number(searchParams.get("limit")) || 50;

    const result = await getAuditAuditLogs({
      user,
      id,
      organizationId: user?.organizationId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AUDIT AUDIT LOG API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load audit history.",
      },
      {
        status: error?.statusCode || error?.status || 500,
      },
    );
  }
}
