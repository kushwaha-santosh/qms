import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import { requestPasswordReset } from "@/services/auth/auth.service.js";

// ==========================================================
// POST /api/auth/forgot-password
// ==========================================================

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const email = String(body?.email || "").trim();

    const result = await requestPasswordReset({
      email,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.statusCode === 400
            ? error.message
            : "Unable to process the password reset request.",
      },
      {
        status: error?.statusCode === 400 ? 400 : 500,
      },
    );
  }
}
