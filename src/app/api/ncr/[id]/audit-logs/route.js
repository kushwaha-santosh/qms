import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";
import { PERMISSIONS } from "@/lib/auth/permissions.js";
import User from "@/models/User.js";
import AuditLog from "@/models/AuditLog.js";

export async function GET(request, context) {
  try {
    await connectDB();
    const session = await getAuthSession(request);
    if (!session?.userId)
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    const user = await User.findById(session.userId)
      .select("_id role organizationId status")
      .lean();
    if (!user || user.status !== "ACTIVE")
      return NextResponse.json(
        { success: false, message: "User is not active." },
        { status: 403 },
      );

    const auth = await getAuthorizationContext(user);
    if (!userHasPermission(auth?.permissions || [], PERMISSIONS.NCR_VIEW)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view NCR audit history.",
        },
        { status: 403 },
      );
    }

    const params = await context?.params;
    const ncrId = params?.id;
    if (!ncrId)
      return NextResponse.json(
        { success: false, message: "NCR ID is required." },
        { status: 400 },
      );
    if (!mongoose.Types.ObjectId.isValid(ncrId))
      return NextResponse.json(
        { success: false, message: "Invalid NCR ID." },
        { status: 400 },
      );

    const filter = {
      module: "NCR",
      recordId: new mongoose.Types.ObjectId(ncrId),
    };
    if (String(user.role).toUpperCase() !== "SUPER_ADMIN")
      filter.organizationId = user.organizationId;

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error) {
    console.error("GET /api/ncr/:id/audit-logs error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load audit history.",
      },
      { status: error?.name === "CastError" ? 400 : 500 },
    );
  }
}
