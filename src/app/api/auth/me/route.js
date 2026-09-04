import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
getAuthSession,
} from "@/lib/auth/auth.js";

import {
getAuthorizationContext,
getPermissionKeys,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import "@/models/Role.js";
import "@/models/Permission.js";
import "@/models/Organization.js";

// ==========================================================
// GET CURRENT USER
// ==========================================================

export async function GET(request) {
try {
await connectDB();


// ======================================================
// AUTHENTICATION
// ======================================================

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

// ======================================================
// LOAD USER
// ======================================================

const user =
  await User.findById(
    session.userId
  )
    .select("-password")
    .populate({
      path: "organizationId",

      select:
        "name email phone industry status plan",
    })
    .lean();

if (!user) {
  return NextResponse.json(
    {
      success: false,
      message:
        "User account no longer exists.",
    },
    {
      status: 401,
    }
  );
}

// ======================================================
// ACCOUNT STATUS
// ======================================================

if (
  user.status !==
  "ACTIVE"
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "User account is not active.",
    },
    {
      status: 403,
    }
  );
}

// ======================================================
// LOAD RBAC
// ======================================================

const {
  role,
  permissions,
} =
  await getAuthorizationContext(
    user
  );

if (!role) {
  return NextResponse.json(
    {
      success: false,
      message:
        "User role is not configured or inactive.",
    },
    {
      status: 403,
    }
  );
}

// ======================================================
// PERMISSION KEYS
// ======================================================

const permissionKeys =
  getPermissionKeys(
    permissions
  );

// ======================================================
// SAFE USER RESPONSE
// ======================================================

const responseUser = {
  id: String(
    user._id
  ),

  firstName:
    user.firstName,

  lastName:
    user.lastName,

  email:
    user.email,

  role:
    user.role,

  status:
    user.status,

  organizationId:
    user.organizationId ||
    null,

  permissions:
    permissionKeys,
};

// ======================================================
// RESPONSE
// ======================================================
//
// Permissions are intentionally returned in BOTH:
//
//   data.permissions
//
// and:
//
//   data.user.permissions
//
// AuthProvider supports both forms.
//
// ======================================================

return NextResponse.json(
  {
    success: true,

    data: {
      user:
        responseUser,

      permissions:
        permissionKeys,

      role: {
        id:
          role?._id
            ? String(
                role._id
              )
            : null,

        name:
          role?.name ||
          user.role,

        displayName:
          role?.displayName ||
          user.role,

        scope:
          role?.scope ||
          null,
      },
    },
  },
  {
    status: 200,
  }
);


} catch (error) {
console.error(
"Get current user error:",
error
);


return NextResponse.json(
  {
    success: false,

    message:
      error.message ||
      "Unable to retrieve current user.",
  },
  {
    status:
      error.statusCode ||
      500,
  }
);


}
}
