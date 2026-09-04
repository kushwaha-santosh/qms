import { NextResponse } from "next/server";

import { requireAuth, requirePermission } from "@/lib/auth/requireAuth.js";

import {
  listDocuments,
  createDocument,
  createUploadedDocument,
} from "@/services/documents/document.service.js";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.success) {
      return auth.response;
    }

    const result = await listDocuments({
      user: auth.user,

      filters: Object.fromEntries(request.nextUrl.searchParams.entries()),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e) {
    console.error("GET /api/documents error:", e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to load documents.",
      },
      {
        status: e?.statusCode || e?.status || 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_CREATE");

    if (!auth.success) {
      return auth.response;
    }

    const contentType = request.headers.get("content-type") || "";

    /*
     * ========================================
     * MULTIPART / FILE UPLOAD
     * ========================================
     */
    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");

      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json(
          {
            success: false,
            message: "A document file is required.",
          },
          {
            status: 400,
          },
        );
      }

      const data = {};

      for (const [key, value] of formData.entries()) {
        if (key === "file") {
          continue;
        }

        /*
         * FormData values are strings
         * for our document fields.
         */
        data[key] = typeof value === "string" ? value : String(value);
      }

      /*
       * Convert tags into an actual array.
       *
       * Supported:
       *
       * ["ISO","QUALITY"]
       *
       * and:
       *
       * ISO,QUALITY
       */
      if (data.tags) {
        try {
          const parsed = JSON.parse(data.tags);

          data.tags = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
          data.tags = String(data.tags)
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        }
      } else {
        data.tags = [];
      }

      console.log("DOCUMENT UPLOAD:", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        tags: data.tags,
      });

      const document = await createUploadedDocument({
        user: auth.user,
        data,
        file,
      });

      return NextResponse.json(
        {
          success: true,
          document,
        },
        {
          status: 201,
        },
      );
    }

    /*
     * ========================================
     * NORMAL JSON DOCUMENT
     * ========================================
     */
    const body = await request.json();

    const document = await createDocument({
      user: auth.user,
      data: body,
    });

    return NextResponse.json(
      {
        success: true,
        document,
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    console.error("POST /api/documents error:", e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to create document.",
      },
      {
        status: e?.statusCode || e?.status || 500,
      },
    );
  }
}
