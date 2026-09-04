import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requireAuth.js";
import { getSupplierAuditLogs } from "@/services/suppliers/supplier.service.js";
export async function GET(request,context) { try { const a=await requirePermission(request,"SUPPLIER_VIEW");if(!a.success)return a.response;const p=await context.params;const s=request.nextUrl.searchParams;const result=await getSupplierAuditLogs({user:a.user,id:p?.id,page:Number(s.get("page"))||1,limit:Number(s.get("limit"))||50});return NextResponse.json({success:true,data:result}); }catch(e){return NextResponse.json({success:false,message:e?.message||"Unable to load audit history."},{status:e?.statusCode||e?.status||500});} }
