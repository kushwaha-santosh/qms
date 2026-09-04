import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth.js";

import { updateAuditStatus } from "@/services/audit/audit.service.js";

// ==========================================================
// PATCH /api/audits/:id/status
// ==========================================================

export async function PATCH(request, { params }) {
  try {
    const authentication = await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    // Next.js App Router dynamic route parameter
    const routeParams = await params;

    const auditId = routeParams?.id;

    if (!auditId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid audit ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();

    const result = await updateAuditStatus({
      user,
      id: auditId,
      status: body?.status,
      comment: body?.comment || "",
      request,
    });

    return NextResponse.json({
      success: true,
      audit: result,
    });
  } catch (error) {
    console.error("PATCH /api/audits/[id]/status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to update audit status.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}
