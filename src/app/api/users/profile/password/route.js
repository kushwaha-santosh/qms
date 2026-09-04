import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  getAuthSession,
} from "@/lib/auth/auth.js";

import User from "@/models/User.js";

import {
  getRequestMetadata,
  getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

import {
  changeCurrentPassword,
} from "@/services/users/profile.service.js";

// ==========================================================
// CHANGE CURRENT USER PASSWORD
// ==========================================================

export async function PATCH(
  request
) {
  try {
    await connectDB();

    const session =
      await getAuthSession(request);

    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const currentUser =
      await User.findById(
        session.userId
      )
        .select("-password")
        .lean();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account not found.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const actor =
      getAuditActorContext(
        currentUser
      );

    const metadata =
      getRequestMetadata(
        request
      );

    const audit = {
      userId:
        actor.userId,

      user:
        currentUser,

      organizationId:
        actor.organizationId,

      userName:
        actor.userName,

      userEmail:
        actor.userEmail,

      ipAddress:
        metadata.ipAddress,

      userAgent:
        metadata.userAgent,
    };

    await changeCurrentPassword({
      userId:
        session.userId,

      currentPassword:
        body?.currentPassword,

      newPassword:
        body?.newPassword,

      confirmPassword:
        body?.confirmPassword,

      audit,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Password changed successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to change password.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}