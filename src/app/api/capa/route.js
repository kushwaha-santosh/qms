import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/requireAuth.js";
import { getCAPAs, createCAPA } from "@/services/capa/capa.service.js";

const errorResponse = (error) => {
  console.error("CAPA API error:", error);
  return NextResponse.json(
    { success: false, message: error?.message || "CAPA request failed." },
    { status: error?.statusCode || 500 },
  );
};

export async function GET(request) {
  try {
    const authentication = await requireAuth(request);
    if (!authentication.success) return authentication.response;

    const { user } = authentication;
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const organizationId = searchParams.get("organizationId") || null;

    const result = await getCAPAs({
      organizationId: isSuperAdmin ? organizationId : user.organizationId,
      isSuperAdmin,
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      severity: searchParams.get("severity") || "",
      category: searchParams.get("category") || "",
      source: searchParams.get("source") || "",
      department: searchParams.get("department") || "",
      process: searchParams.get("process") || "",
      assignedTo: searchParams.get("assignedTo") || "",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const permission = await requirePermission(request, "CAPA_CREATE");
    if (!permission.success) return permission.response;

    const { user } = permission;
    const data = await request.json();
    const capa = await createCAPA({ data, user, request });

    return NextResponse.json(
      { success: true, message: "CAPA created successfully.", data: capa },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
