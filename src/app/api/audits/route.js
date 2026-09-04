import { NextResponse } from "next/server";

import { requireAuth, requirePermission } from "@/lib/auth/requireAuth.js";

import { listAudits, createAudit } from "@/services/audit/audit.service";

// ==========================================================
// GET /api/audits
// ==========================================================

export async function GET(request) {
  try {
    const authentication = await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    const { searchParams } = new URL(request.url);

    const result = await listAudits({
      user,
      filters: Object.fromEntries(searchParams.entries()),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/audits error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load audits.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}

// ==========================================================
// POST /api/audits
// ==========================================================

export async function POST(request) {
  try {
    const authorization = await requirePermission(request, "AUDIT_CREATE");

    if (!authorization.success) {
      return authorization.response;
    }

    const { user } = authorization;

    const body = await request.json();

    const audit = await createAudit({
      user,
      data: {
        ...body,
        request,
      },
    });

    return NextResponse.json(
      {
        success: true,
        audit,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/audits error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to create audit.",
      },
      {
        status: error?.status || error?.statusCode || 500,
      },
    );
  }
}
