import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";

import User from "@/models/User.js";

import { assignNCR } from "@/services/ncr/ncr.service.js";

// ==========================================================
// POST /api/ncr/:id/assign
// ==========================================================

export async function POST(request, { params }) {
  try {
    await connectDB();

    const session = await getAuthSession(request);

    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const user = await User.findById(session.userId)
      .select(
        "firstName lastName name fullName email role status organizationId",
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const ncr = await assignNCR({
      user,

      ncrId: params?.id,

      assignedTo: body?.assignedTo,

      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "NCR assigned successfully.",
        data: ncr,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/ncr/:id/assign error:", error);

    const status = error?.statusCode || 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status >= 400 && status < 500
            ? error.message
            : "Unable to assign NCR.",
      },
      { status },
    );
  }
}
