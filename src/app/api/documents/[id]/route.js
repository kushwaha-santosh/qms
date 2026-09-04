import { NextResponse } from "next/server";

import { requireAuth, requirePermission } from "@/lib/auth/requireAuth.js";

import {
  getDocumentById,
  updateDocument,
  updateUploadedDocument,
  deleteDocument,
} from "@/services/documents/document.service.js";

export const runtime = "nodejs";

export async function GET(request, context) {
  try {
    const auth = await requireAuth(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await context.params;

    const document = await getDocumentById({
      user: auth.user,
      id,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (e) {
    console.error("GET /api/documents/[id] error:", e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to load document.",
      },
      {
        status: e?.statusCode || e?.status || 500,
      },
    );
  }
}

export async function PUT(request, context) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_UPDATE");

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const contentType = (
      request.headers.get("content-type") || ""
    ).toLowerCase();

    /*
     * ============================================================
     * MULTIPART / FILE UPLOAD UPDATE
     * ============================================================
     */
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");

      const data = Object.fromEntries(formData.entries());

      delete data.file;

      /*
       * File can be:
       *   - File object when a replacement is selected
       *   - null when existing file should be retained
       */
      const hasFile =
        file &&
        typeof file === "object" &&
        typeof file.arrayBuffer === "function";

      console.log("PUT /api/documents/[id] multipart:", {
        id,
        fileReceived: Boolean(hasFile),
        fileName: hasFile ? file.name : null,
        fileSize: hasFile ? file.size : null,
        mimeType: hasFile ? file.type : null,
        fileSource: data.fileSource,
        documentNumber: data.documentNumber,
      });

      /*
       * Tags are sent as JSON from DocumentFormModal.
       */
      if (data.tags !== undefined && data.tags !== "") {
        try {
          data.tags = JSON.parse(data.tags);
        } catch {
          data.tags = String(data.tags)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        }
      } else {
        data.tags = [];
      }

      const document = await updateUploadedDocument({
        user: auth.user,
        id,
        data,
        file: hasFile ? file : null,
      });

      return NextResponse.json({
        success: true,
        document,
      });
    }

    /*
     * ============================================================
     * NORMAL JSON UPDATE
     * ============================================================
     */
    const body = await request.json();

    const document = await updateDocument({
      user: auth.user,
      id,
      data: body,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (e) {
    console.error("PUT /api/documents/[id] error:", e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to update document.",
      },
      {
        status: e?.statusCode || e?.status || 500,
      },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const auth = await requirePermission(request, "DOCUMENT_DELETE");

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await context.params;

    const result = await deleteDocument({
      user: auth.user,
      id,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("DELETE /api/documents/[id] error:", e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to delete document.",
      },
      {
        status: e?.statusCode || e?.status || 500,
      },
    );
  }
}
