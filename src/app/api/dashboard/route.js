import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { getDashboardSummary } from "@/services/dashboard/dashboard.service";

export async function GET(request) {
  try {
    // ======================================================
    // AUTHENTICATION
    // ======================================================

    const authentication = await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    // ======================================================
    // QUERY PARAMETERS
    // ======================================================

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate") || null;

    const endDate = searchParams.get("endDate") || null;

    // ======================================================
    // USER CONTEXT
    // ======================================================

    /**
     * SUPER_ADMIN is a global user.
     *
     * SUPER_ADMIN:
     *   organizationId = null
     *
     * Organization users:
     *   organizationId = their tenant ID
     *
     * The dashboard service handles the tenant filter.
     */
    const organizationId = user.organizationId || null;

    const role = String(user.role || "")
      .trim()
      .toUpperCase();

    // ======================================================
    // DASHBOARD
    // ======================================================

    const dashboard = await getDashboardSummary({
      organizationId,
      role,
      startDate,
      endDate,
    });

    // ======================================================
    // RESPONSE
    // ======================================================

    return NextResponse.json(
      {
        success: true,
        data: dashboard,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    // ======================================================
    // ERROR LOG
    // ======================================================

    console.error("[GET /api/dashboard]", error);

    // ======================================================
    // BAD REQUEST
    // ======================================================

    if (error?.status === 400 || error?.statusCode === 400) {
      return NextResponse.json(
        {
          success: false,
          message: error?.message || "Invalid dashboard request.",
        },
        {
          status: 400,
        },
      );
    }

    // ======================================================
    // UNAUTHORIZED
    // ======================================================

    if (
      error?.status === 401 ||
      error?.statusCode === 401 ||
      error?.code === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    // ======================================================
    // FORBIDDEN
    // ======================================================

    if (
      error?.status === 403 ||
      error?.statusCode === 403 ||
      error?.code === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            error?.message ||
            "You do not have permission to access the dashboard.",
        },
        {
          status: 403,
        },
      );
    }

    // ======================================================
    // INTERNAL SERVER ERROR
    // ======================================================

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard data.",
      },
      {
        status: 500,
      },
    );
  }
}
