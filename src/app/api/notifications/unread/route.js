import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";
import { getUnreadNotificationCount } from "@/services/notification/notification.service.js";
const auth = async (request) => { const s = await getAuthSession(request); if (!s?.userId) throw Object.assign(new Error("Authentication required."), { statusCode: 401 }); const u = await User.findById(s.userId).select("-password").lean(); if (!u) throw Object.assign(new Error("User account no longer exists."), { statusCode: 401 }); if (u.status !== "ACTIVE") throw Object.assign(new Error("User account is not active."), { statusCode: 403 }); return u; };
export async function GET(request) { try { await connectDB(); const user = await auth(request); return NextResponse.json({ success: true, data: { unreadCount: await getUnreadNotificationCount({ user }) } }); } catch (e) { return NextResponse.json({ success: false, message: e?.message || "Unable to load notification count." }, { status: e?.statusCode || 500 }); } }
