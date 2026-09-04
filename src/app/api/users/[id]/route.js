import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";

import {
  getRequestMetadata,
  getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

import {
  getUser,
  updateUser,
  deleteUser,
} from "@/services/users/user.service.js";


// ==========================================================
// BUILD AUDIT CONTEXT
// ==========================================================

const buildAuditContext = (user, request) => {
  const actor = getAuditActorContext(user);
  const metadata = getRequestMetadata(request);

  return {
    userId: actor.userId,
    user,
    organizationId: actor.organizationId,
    userName: actor.userName,
    userEmail: actor.userEmail,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  };
};

const getCurrentUser = async (
  request
) => {
  const session =
    await getAuthSession(request);

  if (!session?.userId) {
    return null;
  }

  return User.findById(
    session.userId
  )
    .select("-password")
    .lean();
};

export async function GET(
  request,
  { params }
) {
  try {
    await connectDB();

    const currentUser =
      await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const user =
      await getUser({
        user: currentUser,
        userId: id,
      });

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(
      "Get user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to retrieve user.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}

export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    const currentUser =
      await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const body =
      await request.json();

    const audit = buildAuditContext(currentUser, request);

    const updatedUser =
      await updateUser({
        user: currentUser,
        userId: id,
        data: body,
        audit,
      });

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to update user.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}

export async function DELETE(
  request,
  { params }
) {
  try {
    await connectDB();

    const currentUser =
      await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const audit = buildAuditContext(currentUser, request);

    const result =
      await deleteUser({
        user: currentUser,
        userId: id,
        audit,
      });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "Delete user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to delete user.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}