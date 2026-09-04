import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import { getEffectivePageMetadata } from "@/services/pageMetadata/pageMetadata.service.js";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const path = searchParams.get("path") || "";

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          message: "Page path is required.",
        },
        {
          status: 400,
        },
      );
    }

    const pageMetadata = await getEffectivePageMetadata(path);

    return NextResponse.json(
      {
        success: true,
        data: {
          pageMetadata,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("GET /api/pageMetadata/effective error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to retrieve page metadata.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}
