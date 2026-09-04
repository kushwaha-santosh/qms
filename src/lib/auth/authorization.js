import Role from "@/models/Role.js";

// Register Permission model before populate().
import "@/models/Permission.js";

import { getOrganizationId } from "./session.js";

// ==========================================================
// NORMALIZE PERMISSION
// ==========================================================

const normalizePermission = (
permission
) => {
return String(permission || "")
.trim()
.toUpperCase();
};

// ==========================================================
// LOAD AUTHORIZATION CONTEXT
// ==========================================================

/**

* Loads the authenticated user's active role and permissions.
*
* SUPER_ADMIN:
* Uses the global SYSTEM role.
*
* Organization users:
* Uses the active ORGANIZATION role belonging to the
* authenticated user's organization.
  */
  export const getAuthorizationContext =
  async (user) => {
  if (!user?.role) {
  return {
  role: null,
  permissions: [],
  };
  }


// ======================================================



// SUPER ADMIN
// ======================================================

if (
  user.role ===
  "SUPER_ADMIN"
) {
  const role =
    await Role.findOne({
      name: "SUPER_ADMIN",
      scope: "SYSTEM",
      organizationId: null,
      isActive: true,
    });

  // SUPER_ADMIN has global access. Load every active permission so
  // newly added permissions such as PAGEMETA_VIEW are available
  // automatically without another seed/code change.
  const Permission = (await import("@/models/Permission.js")).default;
  const permissions = await Permission.find({
    isActive: true,
  })
    .select("_id key name description module action isActive")
    .lean();

  return {
    role,
    permissions,
  };
}

// ======================================================
// ORGANIZATION USER
// ======================================================

const organizationId =
  getOrganizationId(user);

if (!organizationId) {
  return {
    role: null,
    permissions: [],
  };
}

const role =
  await Role.findOne({
    name: user.role,

    scope:
      "ORGANIZATION",

    organizationId,

    isActive: true,
  }).populate({
    path: "permissions",

    match: {
      isActive: true,
    },
  });

return {
  role,

  permissions:
    role?.permissions || [],
};


};

// ==========================================================
// CHECK PERMISSION
// ==========================================================

export const userHasPermission = (
permissions = [],
requiredPermission
) => {
const required =
normalizePermission(
requiredPermission
);

if (!required) {
return false;
}

return permissions.some(
(permission) => {
const key =
normalizePermission(
typeof permission ===
"string"
? permission
: permission?.key ||
permission?.code
);


  return key === required;
}


);
};

// ==========================================================
// GET PERMISSION KEYS
// ==========================================================

export const getPermissionKeys = (
permissions = []
) => {
return permissions
.map((permission) =>
normalizePermission(
typeof permission ===
"string"
? permission
: permission?.key ||
permission?.code
)
)
.filter(Boolean);
};

// ==========================================================
// CHECK ROLE
// ==========================================================

export const userHasRole = (
user,
...roles
) => {
if (!user?.role) {
return false;
}

return roles.includes(
user.role
);
};

// ==========================================================
// CHECK SUPER ADMIN
// ==========================================================

export const isSuperAdmin = (
user
) => {
return (
user?.role ===
"SUPER_ADMIN"
);
};
