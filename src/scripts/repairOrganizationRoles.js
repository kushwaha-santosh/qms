
import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";

import Organization from "../models/Organization.js";

import {
  provisionOrganizationRoles,
} from "../services/rbac/organizationRoles.service.js";


// ==========================================================
// REPAIR ORGANIZATION ROLES
// ==========================================================

const repairOrganizationRoles = async () => {
  try {
    await connectDB();

    console.log(
      "Starting organization RBAC role repair..."
    );

    const organizations =
      await Organization.find({})
        .select("_id name")
        .lean();

    console.log(
      `Organizations found: ${organizations.length}`
    );

    let processed = 0;

    for (const organization of organizations) {
      console.log(
        `Provisioning roles for: ${organization.name} (${organization._id})`
      );

      const roles =
        await provisionOrganizationRoles(
          organization._id
        );

      console.log(
        `  Roles ready: ${roles.length}`
      );

      processed++;
    }

    console.log("");
    console.log(
      `Organization RBAC repair completed.`
    );

    console.log(
      `Organizations processed: ${processed}`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Organization RBAC repair failed:",
      error
    );

    process.exit(1);
  }
};


repairOrganizationRoles();

