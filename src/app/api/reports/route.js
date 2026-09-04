import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth.js";
import { getReports } from "@/services/reports/report.service.js";
export async function GET(request){try{const auth=await requireAuth(request);if(!auth.success)return auth.response;const p=request.nextUrl.searchParams;const data=await getReports({user:auth.user,from:p.get("from"),to:p.get("to")});return NextResponse.json({success:true,...data});}catch(e){console.error("GET /api/reports error:",e);return NextResponse.json({success:false,message:e?.message||"Unable to load reports."},{status:e?.statusCode||e?.status||500});}}
