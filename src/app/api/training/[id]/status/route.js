import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { updateTrainingStatus } from "@/services/training/training.service.js";
export async function PATCH(request, context) {
  try {
    const a = await requirePermission(request, "TRAINING_STATUS_UPDATE");
    if (!a.success) return a.response;
    const p = await context.params;
    const body = await request.json();
    const record = await updateTrainingStatus({
      user: a.user,
      id: p?.id,
      status: body.status,
      statusComment: body.statusComment,
    });
    return NextResponse.json({ success: true, record });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || "Unable to update status." },
      { status: e?.statusCode || e?.status || 500 },
    );
  }
}
