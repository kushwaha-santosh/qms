import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requireAuth.js";

import { assignCAPA } from "@/services/capa/capa.service.js";

export async function PATCH(request, context) {
  try {
    const auth = await requirePermission(request, "CAPA_UPDATE");

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
          message: "CAPA ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();

    const result = await assignCAPA({
      id,
      assignedTo: body?.assignedTo,
      user,
      request,
    });

    return NextResponse.json({
      success: true,
      message: "CAPA assigned successfully.",
      data: result,
    });
  } catch (error) {
    console.error("CAPA ASSIGN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to assign CAPA.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}
