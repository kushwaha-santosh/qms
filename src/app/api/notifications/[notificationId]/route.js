import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";
import {
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
} from "@/services/notification/notification.service.js";
const auth = async (request) => {
  const s = await getAuthSession(request);
  if (!s?.userId)
    throw Object.assign(new Error("Authentication required."), {
      statusCode: 401,
    });
  const u = await User.findById(s.userId).select("-password").lean();
  if (!u)
    throw Object.assign(new Error("User account no longer exists."), {
      statusCode: 401,
    });
  if (u.status !== "ACTIVE")
    throw Object.assign(new Error("User account is not active."), {
      statusCode: 403,
    });
  return u;
};
const nid = async (params) => (await params)?.notificationId || "";
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await auth(request);
    const body = await request.json().catch(() => ({}));
    const data =
      body?.isRead === false
        ? await markNotificationUnread({
            user,
            notificationId: await nid(params),
          })
        : await markNotificationRead({
            user,
            notificationId: await nid(params),
          });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to update notification.",
      },
      { status: e?.statusCode || 500 },
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await auth(request);
    const data = await deleteNotification({
      user,
      notificationId: await nid(params),
    });
    return NextResponse.json({
      success: true,
      data,
      message: "Notification deleted.",
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Unable to delete notification.",
      },
      { status: e?.statusCode || 500 },
    );
  }
}
