import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  requireAuth,
} from "@/lib/auth/requireAuth.js";

export async function GET(request) {
  try {
    await connectDB();

    const result =
      await requireAuth(request);

    if (!result.success) {
      return result.response;
    }

    const { user } = result;

    return NextResponse.json({
      success: true,
      message: "RBAC authentication is working.",
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        organizationId:
          user.organizationId?._id ||
          user.organizationId ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "RBAC test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "RBAC test failed.",
      },
      {
        status: 500,
      }
    );
  }
}