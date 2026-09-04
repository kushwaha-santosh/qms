import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requireAuth.js";

import { updateCAPAStatus } from "@/services/capa/capa.service.js";

export async function PATCH(request, context) {
  try {
    // ======================================================
    // AUTHENTICATION / AUTHORIZATION
    // ======================================================

    const authentication = await requirePermission(
      request,
      "CAPA_STATUS_UPDATE",
    );

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    // ======================================================
    // PARAMS
    // ======================================================

    const params = await context.params;

    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "CAPA ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // ======================================================
    // REQUEST BODY
    // ======================================================

    const body = await request.json();

    const status = body?.status;

    const comments = body?.comments ?? body?.comment ?? "";

    // ======================================================
    // UPDATE STATUS
    // ======================================================

    const capa = await updateCAPAStatus({
      id,

      status,

      comments,

      user,

      request,
    });

    // ======================================================
    // RESPONSE
    // ======================================================

    return NextResponse.json(
      {
        success: true,

        message: "CAPA status updated successfully.",

        data: capa,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("CAPA status API error:", error);

    return NextResponse.json(
      {
        success: false,

        message: error?.message || "Unable to update CAPA status.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}
