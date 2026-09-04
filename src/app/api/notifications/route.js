import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";
import { listNotifications } from "@/services/notification/notification.service.js";

const auth = async (request) => { const session = await getAuthSession(request); if (!session?.userId) throw Object.assign(new Error("Authentication required."), { statusCode: 401 }); const user = await User.findById(session.userId).select("-password").lean(); if (!user) throw Object.assign(new Error("User account no longer exists."), { statusCode: 401 }); if (user.status !== "ACTIVE") throw Object.assign(new Error(`User account is not active. Current status: ${user.status || "UNKNOWN"}`), { statusCode: 403 }); return user; };
export async function GET(request) { try { await connectDB(); const user = await auth(request); const u = new URL(request.url); const result = await listNotifications({ user, page: u.searchParams.get("page") || 1, limit: u.searchParams.get("limit") || 20, unreadOnly: u.searchParams.get("unreadOnly") === "true", module: u.searchParams.get("module") || "", type: u.searchParams.get("type") || "" }); return NextResponse.json({ success: true, data: result.notifications, pagination: result.pagination, unreadCount: result.unreadCount }); } catch (e) { console.error("Get notifications error:", e); return NextResponse.json({ success: false, message: e?.message || "Unable to load notifications." }, { status: e?.statusCode || 500 }); } }
