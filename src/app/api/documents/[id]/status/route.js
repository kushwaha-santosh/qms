import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { updateDocumentStatus } from "@/services/documents/document.service.js";

export async function PATCH(request, context) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_STATUS_UPDATE");
    if (!auth.success) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const document = await updateDocumentStatus({
      user: auth.user,
      id,
      status: body?.status,
      statusComment: body?.statusComment,
    });
    return NextResponse.json({ success: true, document });
  } catch (e) {
    console.error("PATCH /api/documents/[id]/status error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to update document status.",
      },
      { status: e?.statusCode || e?.status || 500 },
    );
  }
}
