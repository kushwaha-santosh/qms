import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";

import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import Organization from "../models/Organization.js";

import {
  PERMISSIONS,
  ROLES,
} from "../lib/auth/permissions.js";

import {
  getDefaultRolePermissions,
} from "../lib/auth/rolePermissions.js";


// ==========================================================
// PERMISSION METADATA
// ==========================================================

const permissionMetadata = {
  DASHBOARD: {
    module: "DASHBOARD",
    name: "Dashboard",
  },

  ORGANIZATION: {
    module: "ORGANIZATION",
    name: "Organization",
  },

  USER: {
    module: "USER",
    name: "Users",
  },

  ROLE: {
    module: "ROLE",
    name: "Roles",
  },

  PERMISSION: {
    module: "PERMISSION",
    name: "Permissions",
  },

  NCR: {
    module: "NCR",
    name: "Non-Conformance",
  },

  CAPA: {
    module: "CAPA",
    name: "CAPA",
  },

  AUDIT: {
    module: "AUDIT",
    name: "Audits",
  },

  DOCUMENT: {
    module: "DOCUMENT",
    name: "Documents",
  },

  TRAINING: {
    module: "TRAINING",
    name: "Training",
  },

  SUPPLIER: {
    module: "SUPPLIER",
    name: "Suppliers",
  },

  REPORT: {
    module: "REPORT",
    name: "Reports",
  },
};


// ==========================================================
// CREATE PERMISSIONS
// ==========================================================

const seedPermissions = async () => {
  const permissions = [];

  for (const key of Object.values(PERMISSIONS)) {
    const parts = key.split("_");

    const module = parts[0];

    const action = parts
      .slice(1)
      .join("_");

    const metadata =
      permissionMetadata[module] || {
        module,
        name: module,
      };

    permissions.push({
      key,

      name: `${metadata.name} - ${action
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )}`,

      description: `Allows ${action
        .replaceAll("_", " ")
        .toLowerCase()} access for ${metadata.name}.`,

      module: metadata.module,

      action,

      isActive: true,
    });
  }

  await Permission.bulkWrite(
    permissions.map((permission) => ({
      updateOne: {
        filter: {
          key: permission.key,
        },

        update: {
          $set: permission,
        },

        upsert: true,
      },
    }))
  );

  console.log(
    `Permissions seeded: ${permissions.length}`
  );
};


// ==========================================================
// CREATE SYSTEM SUPER ADMIN ROLE
// ==========================================================

const seedSuperAdminRole = async () => {
  const permissions =
    await Permission.find({
      key: {
        $in: getDefaultRolePermissions(
          ROLES.SUPER_ADMIN
        ),
      },

      isActive: true,
    });

  await Role.findOneAndUpdate(
    {
      name: ROLES.SUPER_ADMIN,

      scope: "SYSTEM",

      organizationId: null,
    },

    {
      $set: {
        displayName:
          "Super Administrator",

        description:
          "Global QMS administrator with unrestricted access.",

        permissions:
          permissions.map(
            (permission) =>
              permission._id
          ),

        isSystemRole: true,

        isActive: true,
      },
    },

    {
      upsert: true,
      returnDocument: "after",
    }
  );

  console.log(
    "SUPER_ADMIN role seeded."
  );
};


// ==========================================================
// CREATE ORGANIZATION ROLES
// ==========================================================

const seedOrganizationRoles = async () => {
  const organizations =
    await Organization.find({
      status: {
        $ne: "SUSPENDED",
      },
    }).select("_id name");

  if (!organizations.length) {
    console.log(
      "No organizations found. Organization roles skipped."
    );

    return;
  }

  const organizationRoles = [
    {
      role: ROLES.ORG_ADMIN,
      displayName: "Organization Administrator",
      description:
        "Administrator for an organization.",
    },

    {
      role: ROLES.QUALITY_MANAGER,
      displayName: "Quality Manager",
      description:
        "Manages quality activities and quality records.",
    },

    {
      role: ROLES.QUALITY_ENGINEER,
      displayName: "Quality Engineer",
      description:
        "Performs quality engineering activities.",
    },

    {
      role: ROLES.AUDITOR,
      displayName: "Auditor",
      description:
        "Performs audit activities.",
    },

    {
      role: ROLES.EMPLOYEE,
      displayName: "Employee",
      description:
        "Standard organization employee.",
    },

    {
      role: ROLES.VIEWER,
      displayName: "Viewer",
      description:
        "Read-only access to permitted modules.",
    },
  ];

  for (const organization of organizations) {
    for (const roleDefinition of organizationRoles) {
      const permissionKeys =
        getDefaultRolePermissions(
          roleDefinition.role
        );

      const permissions =
        await Permission.find({
          key: {
            $in: permissionKeys,
          },

          isActive: true,
        }).select("_id");

      await Role.findOneAndUpdate(
        {
          name: roleDefinition.role,

          scope: "ORGANIZATION",

          organizationId:
            organization._id,
        },

        {
          $set: {
            displayName:
              roleDefinition.displayName,

            description:
              roleDefinition.description,

            permissions:
              permissions.map(
                (permission) =>
                  permission._id
              ),

            isSystemRole: true,

            isActive: true,
          },
        },

        {
          upsert: true,
          returnDocument: "after",
        }
      );
    }

    console.log(
      `Organization roles seeded: ${organization.name}`
    );
  }
};


// ==========================================================
// MAIN
// ==========================================================

const seed = async () => {
  try {
    await connectDB();

    await seedPermissions();

    await seedSuperAdminRole();

    await seedOrganizationRoles();

    console.log(
      "RBAC seeding completed successfully."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "RBAC seeding failed:",
      error
    );

    process.exit(1);
  }
};

seed();