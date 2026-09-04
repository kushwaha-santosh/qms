import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose.js";

import {
getAuthSession,
} from "@/lib/auth/auth.js";

import {
getAuthorizationContext,
userHasPermission,
} from "@/lib/auth/authorization.js";

import User from "@/models/User.js";

import {
listRoles,
createRole,
} from "@/services/roles/role.service.js";

import { PERMISSIONS } from "@/lib/auth/permissions.js";

import {
getRequestMetadata,
getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// BUILD AUDIT CONTEXT
// ==========================================================

const buildAuditContext = (
user,
request
) => {
const actor =
getAuditActorContext(user);

const metadata =
getRequestMetadata(request);

return {
userId: actor.userId,
user,
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
};

// ==========================================================
// LOAD AUTHENTICATED USER
// ==========================================================

const loadAuthenticatedUser = async (
request
) => {
const session =
await getAuthSession(request);

if (!session?.userId) {
const error = new Error(
"Authentication required."
);


error.statusCode = 401;

throw error;


}

const user =
await User.findById(
session.userId
)
.select("-password")
.lean();

if (!user) {
const error = new Error(
"User account no longer exists."
);


error.statusCode = 401;

throw error;


}

if (user.status !== "ACTIVE") {
const error = new Error(
"User account is not active."
);


error.statusCode = 403;

throw error;


}

return user;
};

// ==========================================================
// AUTHORIZE PERMISSION
// ==========================================================

const authorizePermission = async (
user,
permission
) => {
const {
role,
permissions,
} =
await getAuthorizationContext(
user
);

if (!role) {
const error = new Error(
"User role is not configured or inactive."
);


error.statusCode = 403;

throw error;


}

const allowed =
userHasPermission(
permissions,
permission
);

if (!allowed) {
const error = new Error(
"You do not have permission to perform this action."
);


error.statusCode = 403;

throw error;


}
};

// ==========================================================
// GET /api/roles
// ==========================================================

export async function GET(request) {
try {
await connectDB();


const user =
  await loadAuthenticatedUser(
    request
  );

await authorizePermission(
  user,
  PERMISSIONS.ROLE_VIEW
);

const {
  search = "",
  scope = "",
  isActive = "",
  organizationId = "",
} =
  Object.fromEntries(
    request.nextUrl.searchParams
  );

const roles =
  await listRoles({
    user,
    organizationId:
      organizationId || null,
    search,
    scope,
    isActive,
  });

return NextResponse.json(
  {
    success: true,

    data: {
      roles,
      total: roles.length,
    },
  },
  {
    status: 200,
  }
);


} catch (error) {
console.error(
"List roles error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      error.message ||
      "Unable to retrieve roles.",
  },
  {
    status:
      error.statusCode || 500,
  }
);


}
}

// ==========================================================
// POST /api/roles
// ==========================================================

export async function POST(request) {
try {
await connectDB();


const user =
  await loadAuthenticatedUser(
    request
  );

await authorizePermission(
  user,
  PERMISSIONS.ROLE_CREATE
);

const body =
  await request.json();

const {
  name,
  displayName,
  description,
  scope,
  organizationId,
  permissions:
    permissionIds,
} = body || {};

const audit =
  buildAuditContext(
    user,
    request
  );

const createdRole =
  await createRole({
    user,
    audit,
    name,
    displayName,
    description,
    scope,
    organizationId,
    permissions:
      permissionIds,
  });

return NextResponse.json(
  {
    success: true,

    message:
      "Role created successfully.",

    data: {
      role: createdRole,
    },
  },
  {
    status: 201,
  }
);


} catch (error) {
console.error(
"Create role error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      error.message ||
      "Unable to create role.",
  },
  {
    status:
      error.statusCode || 500,
  }
);


}
}
