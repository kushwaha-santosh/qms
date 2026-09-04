import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { getCAPAById, updateCAPA, deleteCAPA } from "@/services/capa/capa.service.js";

export async function GET(request, context) {
  try {
    const auth = await requirePermission(request, "CAPA_VIEW");
    if (!auth.success) return auth.response;
    const { user } = auth;
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, message: "CAPA ID is required." }, { status: 400 });

    const capa = await getCAPAById({ id, organizationId: user?.organizationId, isSuperAdmin: user?.role === "SUPER_ADMIN" });
    return NextResponse.json({ success: true, data: capa });
  } catch (error) {
    console.error("GET CAPA BY ID ERROR:", error);
    return NextResponse.json({ success: false, message: error?.message || "Unable to get CAPA." }, { status: error?.statusCode || 500 });
  }
}

export async function PUT(request, context) {
  try {
    const auth = await requirePermission(request, "CAPA_UPDATE");
    if (!auth.success) return auth.response;
    const { user } = auth;
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, message: "CAPA ID is required." }, { status: 400 });

    const body = await request.json();
    const capa = await updateCAPA({ id, data: body, user, request });
    return NextResponse.json({ success: true, message: "CAPA updated successfully.", data: capa });
  } catch (error) {
    console.error("UPDATE CAPA ERROR:", error);
    return NextResponse.json({ success: false, message: error?.message || "Unable to update CAPA." }, { status: error?.statusCode || 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const auth = await requirePermission(request, "CAPA_DELETE");
    if (!auth.success) return auth.response;
    const { user } = auth;
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, message: "CAPA ID is required." }, { status: 400 });

    const result = await deleteCAPA({ id, user, request });
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE CAPA ERROR:", error);
    return NextResponse.json({ success: false, message: error?.message || "Unable to delete CAPA." }, { status: error?.statusCode || 500 });
  }
}
