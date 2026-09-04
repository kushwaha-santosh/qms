import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";

import User from "@/models/User.js";

import {
  getNCRById,
  updateNCR,
  deleteNCR,
} from "@/services/ncr/ncr.service.js";

// ==========================================================
// GET /api/ncr/:id
// ==========================================================

export async function GET(request, { params }) {
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

    const routeParams = await params;

    const ncrId = routeParams?.id;

    const ncr = await getNCRById({
      user,
      ncrId,
    });

    return NextResponse.json(
      {
        success: true,
        data: ncr,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/ncr/:id error:", error);

    const status = error?.statusCode || 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status >= 400 && status < 500
            ? error.message
            : "Unable to fetch NCR.",
      },
      { status },
    );
  }
}

// ==========================================================
// PUT /api/ncr/:id
// ==========================================================

export async function PUT(request, { params }) {
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

    const ncr = await updateNCR({
      user,

      ncrId: routeParams?.id,

      data: body,

      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "NCR updated successfully.",
        data: ncr,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/ncr/:id error:", error);

    const status = error?.statusCode || 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status >= 400 && status < 500
            ? error.message
            : "Unable to update NCR.",
      },
      { status },
    );
  }
}

// ==========================================================
// DELETE /api/ncr/:id
// ==========================================================

export async function DELETE(request, { params }) {
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

    const result = await deleteNCR({
      user,

      ncrId: routeParams?.id,

      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/ncr/:id error:", error);

    const status = error?.statusCode || 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status >= 400 && status < 500
            ? error.message
            : "Unable to delete NCR.",
      },
      { status },
    );
  }
}
