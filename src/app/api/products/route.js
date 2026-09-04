import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";
import { getAuthSession } from "@/lib/auth/auth.js";

import {
  getAuthorizationContext,
  userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";
import { PERMISSIONS } from "@/lib/auth/permissions.js";

import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} from "@/services/products/product.service.js";

// ==========================================================
// LOAD AUTHENTICATED USER
// ==========================================================

const loadAuthenticatedUser = async (request) => {
  const session = await getAuthSession(request);

  // --------------------------------------------------------
  // NO SESSION
  // --------------------------------------------------------

  if (!session?.userId) {
    const error = new Error("Authentication required.");

    error.statusCode = 401;

    throw error;
  }

  // --------------------------------------------------------
  // LOAD USER
  // --------------------------------------------------------

  const user = await User.findById(session.userId).select("-password").lean();

  // --------------------------------------------------------
  // USER NOT FOUND
  // --------------------------------------------------------

  if (!user) {
    const error = new Error("User account no longer exists.");

    error.statusCode = 401;

    throw error;
  }

  // --------------------------------------------------------
  // USER STATUS
  // --------------------------------------------------------

  if (user.status !== "ACTIVE") {
    const error = new Error(
      `User account is not active. Current status: ${user.status || "UNKNOWN"}`,
    );

    error.statusCode = 403;

    throw error;
  }

  return user;
};

// ==========================================================
// AUTHORIZE PERMISSION
// ==========================================================

const authorizePermission = async (user, permission) => {
  // --------------------------------------------------------
  // DEBUG
  // --------------------------------------------------------

  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------
  //
  // SUPER_ADMIN is a global administrator.
  //
  // Do NOT require PRODUCT_* permissions to be explicitly
  // assigned to the SUPER_ADMIN role.
  //
  // --------------------------------------------------------

  if (user?.role === "SUPER_ADMIN") {
    return;
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  const { role, permissions } = await getAuthorizationContext(user);

  // --------------------------------------------------------
  // ROLE NOT CONFIGURED
  // --------------------------------------------------------

  if (!role) {
    const error = new Error("User role is not configured or inactive.");

    error.statusCode = 403;

    throw error;
  }

  // --------------------------------------------------------
  // CHECK PERMISSION
  // --------------------------------------------------------

  const allowed = userHasPermission(permissions, permission);

  // --------------------------------------------------------
  // DENIED
  // --------------------------------------------------------

  if (!allowed) {
    const error = new Error(
      "You do not have permission to perform this action.",
    );

    error.statusCode = 403;

    throw error;
  }
};

// ==========================================================
// ERROR RESPONSE
// ==========================================================

const handleError = (error) => {
  console.error("[Products API Error]", error);

  return NextResponse.json(
    {
      success: false,
      message: error?.message || "An unexpected error occurred.",
    },
    {
      status: Number(error?.statusCode) || Number(error?.status) || 500,
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

    await authorizePermission(user, PERMISSIONS.PRODUCT_VIEW);

    const url = new URL(request.url);

    const productId =
      url.searchParams.get("productId") || url.searchParams.get("id");

    // ======================================================
    // SINGLE PRODUCT
    // ======================================================

    if (productId) {
      const product = await getProductById(user, productId);

      return NextResponse.json({
        success: true,

        data: {
          product,
        },
      });
    }

    // ======================================================
    // PAGINATION
    // ======================================================

    const page = Number.parseInt(url.searchParams.get("page") || "1", 10) || 1;

    const limit =
      Number.parseInt(url.searchParams.get("limit") || "10", 10) || 10;

    // ======================================================
    // FILTERS
    // ======================================================

    const search = url.searchParams.get("search") || "";

    const isActive = url.searchParams.get("isActive") || "";

    const categoryId = url.searchParams.get("categoryId") || "";

    const brandId = url.searchParams.get("brandId") || "";

    const productTypeId = url.searchParams.get("productTypeId") || "";
    const scope = url.searchParams.get("scope") || "";

    // ======================================================
    // LIST PRODUCTS
    // ======================================================

    const result = await listProducts(user, {
      page,
      limit,
      search,
      isActive,
      categoryId,
      brandId,
      productTypeId,
      scope,
    });

    return NextResponse.json({
      success: true,

      data: {
        products: result?.products || result?.data || [],
      },

      pagination: result?.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================================
// POST
// ==========================================================

export async function POST(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.CREATE);

    const body = await request.json();

    const product = await createProduct(user, body);

    return NextResponse.json(
      {
        success: true,

        message: "Product created successfully.",

        data: {
          product,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================================
// PATCH
// ==========================================================

export async function PATCH(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    const body = await request.json();

    const productId = body?.productId || body?.id;

    // ======================================================
    // PRODUCT ID REQUIRED
    // ======================================================

    if (!productId) {
      const error = new Error("Product ID is required.");

      error.statusCode = 400;

      throw error;
    }

    // ======================================================
    // STATUS UPDATE
    // ======================================================

    if (body?.action === "STATUS") {
      await authorizePermission(user, PERMISSIONS.STATUS_UPDATE);

      const product = await updateProductStatus(user, productId, body.isActive);

      return NextResponse.json({
        success: true,

        message: "Product status updated successfully.",

        data: {
          product,
        },
      });
    }

    // ======================================================
    // NORMAL UPDATE
    // ======================================================

    await authorizePermission(user, PERMISSIONS.UPDATE);

    const product = await updateProduct(user, productId, body);

    return NextResponse.json({
      success: true,

      message: "Product updated successfully.",

      data: {
        product,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================================
// DELETE
// ==========================================================

export async function DELETE(request) {
  try {
    await connectDB();

    const user = await loadAuthenticatedUser(request);

    await authorizePermission(user, PERMISSIONS.DELETE);

    const url = new URL(request.url);

    const productId =
      url.searchParams.get("productId") || url.searchParams.get("id");

    // ======================================================
    // PRODUCT ID REQUIRED
    // ======================================================

    if (!productId) {
      const error = new Error("Product ID is required.");

      error.statusCode = 400;

      throw error;
    }

    // ======================================================
    // DELETE
    // ======================================================

    await deleteProduct(user, productId);

    return NextResponse.json({
      success: true,

      message: "Product deleted successfully.",
    });
  } catch (error) {
    return handleError(error);
  }
}
