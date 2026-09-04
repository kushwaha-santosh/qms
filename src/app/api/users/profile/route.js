
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
  getAuthSession,
} from "@/lib/auth/auth.js";

import User from "@/models/User.js";

import {
  getProfile,
  updateProfile,
} from "@/services/users/profile.service.js";

// ==========================================================
// GET CURRENT USER
// ==========================================================

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

// ==========================================================
// GET PROFILE
// ==========================================================

export async function GET(
  request
) {
  try {
    await connectDB();

    const currentUser =
      await getCurrentUser(
        request
      );

    if (!currentUser) {
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

    const profile =
      await getProfile({
        userId:
          currentUser._id,
      });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: profile,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to retrieve profile.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}

// ==========================================================
// UPDATE PROFILE
// ==========================================================

export async function PATCH(
  request
) {
  try {
    await connectDB();

    const currentUser =
      await getCurrentUser(
        request
      );

    if (!currentUser) {
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

    const body =
      await request.json();

    const updatedUser =
      await updateProfile({
        user:
          currentUser,
        data:
          body,
        request,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Profile updated successfully.",
        data: {
          user:
            updatedUser,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to update profile.",
      },
      {
        status:
          error.statusCode ||
          500,
      }
    );
  }
}

