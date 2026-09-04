import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth.js";

import { getDocumentStorageInfo } from "@/services/documents/document.service.js";

import { readStoredDocument } from "@/services/documents/document.storage.js";

export const runtime = "nodejs";

export async function GET(request, context) {
  try {
    const auth = await requireAuth(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await context.params;

    /*
     * Use the storage-specific query here.
     *
     * getDocumentById() intentionally hides fileAbsolutePath
     * from normal API responses.
     */
    const document = await getDocumentStorageInfo({
      user: auth.user,
      id,
    });

    if (String(document.fileSource || "").toUpperCase() !== "UPLOAD") {
      return NextResponse.json(
        {
          success: false,
          message: "This document does not contain an uploaded file.",
        },
        {
          status: 400,
        },
      );
    }

    if (!document.fileAbsolutePath) {
      return NextResponse.json(
        {
          success: false,
          message: "Document storage path is missing.",
        },
        {
          status: 404,
        },
      );
    }

    const buffer = await readStoredDocument(document.fileAbsolutePath);

    const mimeType = document.mimeType || "application/octet-stream";

    const fileName = document.fileName || document.fileStorageKey || "document";

    /*
     * Sanitize filename for Content-Disposition.
     */
    const safeFileName = String(fileName)
      .replace(/[\r\n"]/g, "")
      .trim();

    return new NextResponse(buffer, {
      status: 200,

      headers: {
        "Content-Type": mimeType,

        "Content-Length": String(buffer.length),

        "Content-Disposition": `inline; filename="${safeFileName}"`,

        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/view error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to view document.",
      },
      {
        status: error?.statusCode || error?.status || 500,
      },
    );
  }
}
