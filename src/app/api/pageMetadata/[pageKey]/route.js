import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";
import User from "@/models/User.js";

import {
  getPageMetadataByKey,
  savePageMetadata,
  updatePageMetadataStatus,
  deletePageMetadata,
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

export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const { pageKey } = await params;

    const pageMetadata = await getPageMetadataByKey({
      user,
      pageKey,
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
// PUT
// ==========================================================

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const { pageKey } = await params;

    const body = await request.json();

    const pageMetadata = await savePageMetadata({
      user,
      pageKey,
      data: body,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Page metadata updated successfully.",
        data: {
          pageMetadata,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error, "Unable to update page metadata.");
  }
}

// ==========================================================
// PATCH - STATUS
// ==========================================================

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const { pageKey } = await params;

    const body = await request.json();

    const pageMetadata = await updatePageMetadataStatus({
      user,
      pageKey,
      isActive: body?.isActive,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Page metadata status updated successfully.",
        data: {
          pageMetadata,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error, "Unable to update page metadata status.");
  }
}

// ==========================================================
// DELETE
// ==========================================================

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const { pageKey } = await params;

    const deleted = await deletePageMetadata({
      user,
      pageKey,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Page metadata deleted successfully.",
        data: {
          pageMetadata: deleted,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error, "Unable to delete page metadata.");
  }
}
