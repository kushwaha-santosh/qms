import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { resetPassword } from "@/services/auth/auth.service.js";

// ==========================================================
// POST /api/auth/reset-password
// ==========================================================

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");
    const confirmPassword = String(body?.confirmPassword || "");

    const result = await resetPassword({
      token,
      password,
      confirmPassword,
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
    console.error("Reset password error:", error);

    const statusCode = error?.statusCode === 400 ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error?.statusCode === 400
            ? error.message
            : "Unable to reset the password.",
      },
      {
        status: statusCode,
      },
    );
  }
}
