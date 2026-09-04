import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth.js";
import Organization from "@/models/Organization.js";

export async function GET(request) {
  try {
    const authentication = await requireAuth(request);

    if (!authentication.success) {
      return authentication.response;
    }

    const { user } = authentication;

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only SUPER_ADMIN can list organizations for CAPA selection.",
        },
        { status: 403 },
      );
    }

    const organizations = await Organization.find({
      status: "ACTIVE",
    })
      .select("_id name displayName email code slug status plan")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("CAPA ORGANIZATIONS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load organizations.",
      },
      { status: error?.statusCode || 500 },
    );
  }
}
