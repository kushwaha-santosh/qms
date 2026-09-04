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

// Register referenced models before populate().
import "@/models/Organization.js";
import "@/models/Permission.js";
import "@/models/Role.js";

import {
getRole,
updateRole,
deleteRole,
updateRolePermissions,
} from "@/services/roles/role.service.js";

import { PERMISSIONS } from "@/lib/auth/permissions.js";

import {
getRequestMetadata,
getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";

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
// CHECK PERMISSION
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
// GET /api/roles/:roleId
// ==========================================================

export async function GET(
request,
{ params }
) {
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

const resolvedParams =
  await params;

const roleId =
  resolvedParams?.roleId;

if (!roleId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Role ID is required.",
    },
    {
      status: 400,
    }
  );
}

const role =
  await getRole({
    user,
    roleId,
  });

return NextResponse.json(
  {
    success: true,

    data: {
      role,
    },
  },
  {
    status: 200,
  }
);


} catch (error) {
console.error(
"Get role error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      error.message ||
      "Unable to retrieve role.",
  },
  {
    status:
      error.statusCode || 500,
  }
);


}
}

// ==========================================================
// PATCH /api/roles/:roleId
// ==========================================================

export async function PATCH(
request,
{ params }
) {
try {
await connectDB();


const user =
  await loadAuthenticatedUser(
    request
  );

const resolvedParams =
  await params;

const roleId =
  resolvedParams?.roleId;

if (!roleId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Role ID is required.",
    },
    {
      status: 400,
    }
  );
}

const body =
  await request.json();

const {
  displayName,
  description,
  isActive,
  permissions:
    permissionIds,
} = body || {};

const audit =
  buildAuditContext(
    user,
    request
  );

let role = null;

// ======================================================
// UPDATE ROLE DETAILS
// ======================================================

const hasRoleDetails =
  displayName !== undefined ||
  description !== undefined ||
  isActive !== undefined;

if (hasRoleDetails) {
  await authorizePermission(
    user,
    PERMISSIONS.ROLE_UPDATE
  );

  role =
    await updateRole({
      user,
      roleId,
      displayName,
      description,
      isActive,
      audit,
    });
}

// ======================================================
// UPDATE ROLE PERMISSIONS
// ======================================================

if (permissionIds !== undefined) {
  await authorizePermission(
    user,
    PERMISSIONS.PERMISSION_ASSIGN
  );

  role =
    await updateRolePermissions({
      user,
      roleId,
      permissions:
        permissionIds,
      audit,
    });
}

if (!role) {
  return NextResponse.json(
    {
      success: false,
      message:
        "No role fields were provided for update.",
    },
    {
      status: 400,
    }
  );
}

return NextResponse.json(
  {
    success: true,

    message:
      "Role updated successfully.",

    data: {
      role,
    },
  },
  {
    status: 200,
  }
);


} catch (error) {
console.error(
"Update role error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      error.message ||
      "Unable to update role.",
  },
  {
    status:
      error.statusCode || 500,
  }
);


}
}

// ==========================================================
// DELETE /api/roles/:roleId
// ==========================================================

export async function DELETE(
request,
{ params }
) {
try {
await connectDB();


const user =
  await loadAuthenticatedUser(
    request
  );

await authorizePermission(
  user,
  PERMISSIONS.ROLE_DELETE
);

const resolvedParams =
  await params;

const roleId =
  resolvedParams?.roleId;

if (!roleId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Role ID is required.",
    },
    {
      status: 400,
    }
  );
}

const audit =
  buildAuditContext(
    user,
    request
  );

const result =
  await deleteRole({
    user,
    roleId,
    audit,
  });

return NextResponse.json(
  result,
  {
    status: 200,
  }
);


} catch (error) {
console.error(
"Delete role error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      error.message ||
      "Unable to delete role.",
  },
  {
    status:
      error.statusCode || 500,
  }
);


}
}
