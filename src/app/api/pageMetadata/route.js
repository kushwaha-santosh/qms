import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";

import {
  listPageMetadata,
  savePageMetadata,
} from "@/services/pageMetadata/pageMetadata.service.js";

// ==========================================================
// LOAD AUTHENTICATED USER
// ==========================================================

const loadAuthenticatedUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    const error = new Error("Authentication required.");

    error.statusCode = 401;

    throw error;
  }

  const user = await User.findById(session.userId).select("-password").lean();

  if (!user) {
    const error = new Error("User account no longer exists.");

    error.statusCode = 401;

    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("User account is not active.");

    error.statusCode = 403;

    throw error;
  }

  return user;
};

// ==========================================================
// ERROR HANDLER
// ==========================================================

const handleError = (error, fallback) => {
  console.error(fallback, error);

  return NextResponse.json(
    {
      success: false,
      message: error?.message || fallback,
    },
    {
      status: error?.statusCode || 500,
    },
  );
};

// ==========================================================
// GET
// ==========================================================

export async function GET(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const pageMetadata = await listPageMetadata({
      user,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          pageMetadata,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error, "Unable to retrieve page metadata.");
  }
}

// ==========================================================
// POST
// ==========================================================

export async function POST(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const body = await request.json();

    const pageMetadata = await savePageMetadata({
      user,
      pageKey: body?.key,
      data: body,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Page metadata saved successfully.",
        data: {
          pageMetadata,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleError(error, "Unable to save page metadata.");
  }
}
