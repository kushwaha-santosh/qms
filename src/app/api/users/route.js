import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";

import {
  getRequestMetadata,
  getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

import {
  listUsers,
  createUser,
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


export async function GET(request) {
  try {
    await connectDB();

    const session =
      await getAuthSession(request);

    if (!session?.userId) {
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
          message: "User account not found.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const result =
      await listUsers({
        user: currentUser,
        search:
          searchParams.get(
            "search"
          ) || "",
        role:
          searchParams.get(
            "role"
          ) || "",
        status:
          searchParams.get(
            "status"
          ) || "",
        page:
          searchParams.get(
            "page"
          ) || 1,
        limit:
          searchParams.get(
            "limit"
          ) || 20,
      });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "List users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to retrieve users.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const session =
      await getAuthSession(request);

    if (!session?.userId) {
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
          message: "User account not found.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const audit = buildAuditContext(currentUser, request);

    const createdUser =
      await createUser({
        user: currentUser,
        data: body,
        audit,
      });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        data: {
          user: createdUser,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to create user.",
      },
      {
        status:
          error.statusCode || 500,
      }
    );
  }
}