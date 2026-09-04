import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";
import { getNCRStatusWorkflow } from "@/services/ncr/ncr.service.js";

export async function GET(request) {
  try {
    await connectDB();
    const session = await getAuthSession(request);
    if (!session?.userId) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });

    const user = await User.findById(session.userId)
      .select("firstName lastName name fullName email role status organizationId")
      .lean();
    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 401 });

    const workflow = await getNCRStatusWorkflow({ user, organizationId: new URL(request.url).searchParams.get("organizationId") || user.organizationId });
    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error("GET /api/ncr/options error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Unable to fetch NCR options." }, { status: error?.statusCode || 500 });
  }
}
