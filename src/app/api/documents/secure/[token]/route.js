import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth.js";
import Document from "@/models/Document.js";
import { verifyDocumentAccessToken } from "@/services/documents/document.token.service.js";
import { readStoredDocument } from "@/services/documents/document.storage.js";

export async function GET(request, context) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success) return auth.response;

    const { token } = await context.params;
    let payload;
    try {
      payload = await verifyDocumentAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired document access token." },
        { status: 401 },
      );
    }

    if (String(payload.userId) !== String(auth.user._id)) {
      return NextResponse.json(
        { success: false, message: "Document access token does not belong to this user." },
        { status: 403 },
      );
    }

    const userOrgId = auth.user?.organizationId?._id || auth.user?.organizationId;
    const isSuperAdmin = String(auth.user?.role || "").toUpperCase() === "SUPER_ADMIN";

    const document = await Document.findById(payload.documentId).lean();
    if (!document) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    const documentOrgId = document.organizationId?._id || document.organizationId;
    if (!isSuperAdmin && String(documentOrgId) !== String(userOrgId)) {
      return NextResponse.json({ success: false, message: "Document access denied." }, { status: 403 });
    }

    if (String(payload.organizationId) !== String(documentOrgId)) {
      return NextResponse.json({ success: false, message: "Document access token is invalid." }, { status: 403 });
    }

    if (document.fileSource !== "UPLOAD" || !document.fileAbsolutePath) {
      return NextResponse.json({ success: false, message: "Uploaded document file is unavailable." }, { status: 404 });
    }

    const buffer = await readStoredDocument(document.fileAbsolutePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `inline; filename="${String(document.fileName || "document").replace(/[/\\"]/g, "_")}"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("GET /api/documents/secure/[token] error:", e);
    return NextResponse.json(
      { success: false, message: e?.message || "Unable to access document." },
      { status: e?.statusCode || e?.status || 500 },
    );
  }
}
