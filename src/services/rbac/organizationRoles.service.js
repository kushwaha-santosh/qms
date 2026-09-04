
import Role from "../../models/Role.js";
import Permission from "../../models/Permission.js";


import {
  ROLES,
} from "../../lib/auth/permissions.js";


import {
  getDefaultRolePermissions,
} from "../../lib/auth/rolePermissions.js";

// ==========================================================
// ORGANIZATION ROLE METADATA
// ==========================================================

const ORGANIZATION_ROLES = [
  {
    name: ROLES.ORG_ADMIN,
    displayName: "Organization Administrator",
    description:
      "Administrator with full access to the organization.",
  },

  {
    name: ROLES.QUALITY_MANAGER,
    displayName: "Quality Manager",
    description:
      "Manages quality activities, NCR, CAPA, audits and related QMS processes.",
  },

  {
    name: ROLES.QUALITY_ENGINEER,
    displayName: "Quality Engineer",
    description:
      "Performs quality engineering and operational QMS activities.",
  },

  {
    name: ROLES.AUDITOR,
    displayName: "Auditor",
    description:
      "Performs and manages assigned audit activities.",
  },

  {
    name: ROLES.EMPLOYEE,
    displayName: "Employee",
    description:
      "Standard organization employee with assigned QMS access.",
  },

  {
    name: ROLES.VIEWER,
    displayName: "Viewer",
    description:
      "Read-only access to permitted QMS modules.",
  },
];


// ==========================================================
// CREATE / UPDATE ORGANIZATION ROLES
// ==========================================================

export const provisionOrganizationRoles = async (
  organizationId
) => {
  if (!organizationId) {
    const error = new Error(
      "Organization ID is required to provision roles."
    );

    error.statusCode = 400;

    throw error;
  }

  const results = [];

  for (const roleDefinition of ORGANIZATION_ROLES) {
    const permissionKeys =
      getDefaultRolePermissions(
        roleDefinition.name
      );

    const permissions =
      await Permission.find({
        key: {
          $in: permissionKeys,
        },

        isActive: true,
      }).select("_id key");

    const permissionIds =
      permissions.map(
        (permission) =>
          permission._id
      );

    const role =
      await Role.findOneAndUpdate(
        {
          name: roleDefinition.name,
          organizationId,
        },

        {
          $set: {
            displayName:
              roleDefinition.displayName,

            description:
              roleDefinition.description,

            scope: "ORGANIZATION",

            organizationId,

            permissions:
              permissionIds,

            isSystemRole: false,

            isActive: true,
          },
        },

        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
        }
      ).lean();

    results.push(role);
  }

  return results;
};


// ==========================================================
// ENSURE SINGLE ORGANIZATION ROLE
// ==========================================================

export const ensureOrganizationRole = async ({
  organizationId,
  roleName,
}) => {
  if (!organizationId) {
    const error = new Error(
      "Organization ID is required."
    );

    error.statusCode = 400;

    throw error;
  }

  const roleDefinition =
    ORGANIZATION_ROLES.find(
      (role) =>
        role.name === roleName
    );

  if (!roleDefinition) {
    const error = new Error(
      "Invalid organization role."
    );

    error.statusCode = 400;

    throw error;
  }

  const permissionKeys =
    getDefaultRolePermissions(
      roleName
    );

  const permissions =
    await Permission.find({
      key: {
        $in: permissionKeys,
      },

      isActive: true,
    }).select("_id key");

  return Role.findOneAndUpdate(
    {
      name: roleName,
      organizationId,
    },

    {
      $set: {
        displayName:
          roleDefinition.displayName,

        description:
          roleDefinition.description,

        scope: "ORGANIZATION",

        organizationId,

        permissions:
          permissions.map(
            (permission) =>
              permission._id
          ),

        isSystemRole: false,

        isActive: true,
      },
    },

    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  ).lean();
};


// ==========================================================
// EXPORT ROLE DEFINITIONS
// ==========================================================

export {
  ORGANIZATION_ROLES,
};

