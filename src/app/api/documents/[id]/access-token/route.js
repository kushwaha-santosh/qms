import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { getDocumentStorageInfo } from "@/services/documents/document.service.js";
import { createDocumentAccessToken } from "@/services/documents/document.token.service.js";

export async function POST(request, context) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_VIEW");
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const document = await getDocumentStorageInfo({ user: auth.user, id });

    if (document.fileSource !== "UPLOAD" || !document.fileAbsolutePath) {
      return NextResponse.json(
        { success: false, message: "This document does not have an uploaded file." },
        { status: 400 },
      );
    }

    const organizationId = document.organizationId?._id || document.organizationId;
    const token = await createDocumentAccessToken({
      documentId: document._id,
      userId: auth.user._id,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresIn: process.env.DOCUMENT_TOKEN_EXPIRES_IN || "10m",
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || "Unable to create document access token." },
      { status: e?.statusCode || e?.status || 500 },
    );
  }
}
