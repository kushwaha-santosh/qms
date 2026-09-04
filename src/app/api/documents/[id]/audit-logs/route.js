import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { getDocumentAuditLogs } from "@/services/documents/document.service.js";

export async function GET(request, context) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_VIEW");
    if (!auth.success) return auth.response;
    const { id } = await context.params;
    const page = Number(request.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 50;
    const data = await getDocumentAuditLogs({
      user: auth.user,
      id,
      page,
      limit,
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/documents/[id]/audit-logs error:", e);
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to load document history.",
      },
      { status: e?.statusCode || e?.status || 500 },
    );
  }
}
