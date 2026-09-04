import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

const MASTER_DATA_PERMISSIONS = [
  {
    key: "MASTER_DATA_VIEW",
    name: "View Master Data",
    description: "Allows the user to view master data used by QMS modules.",
    module: "MASTER_DATA",
    action: "VIEW",
  },
  {
    key: "MASTER_DATA_CREATE",
    name: "Create Master Data",
    description: "Allows the user to create master data values.",
    module: "MASTER_DATA",
    action: "CREATE",
  },
  {
    key: "MASTER_DATA_UPDATE",
    name: "Update Master Data",
    description: "Allows the user to update master data values.",
    module: "MASTER_DATA",
    action: "UPDATE",
  },
  {
    key: "MASTER_DATA_DELETE",
    name: "Delete Master Data",
    description: "Allows the user to delete master data values.",
    module: "MASTER_DATA",
    action: "DELETE",
  },
  {
    key: "MASTER_DATA_STATUS_UPDATE",
    name: "Update Master Data Status",
    description:
      "Allows the user to activate or deactivate master data values.",
    module: "MASTER_DATA",
    action: "STATUS_UPDATE",
  },
];

const run = async () => {
  await connectDB();

  const permissionIds = [];

  for (const item of MASTER_DATA_PERMISSIONS) {
    const permission = await Permission.findOneAndUpdate(
      { key: item.key },
      { $set: { ...item, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    permissionIds.push(permission._id);
    console.log(`Permission ready: ${item.key}`);
  }

  // SUPER_ADMIN is global and should always receive all permissions.
  const superAdminRole = await Role.findOne({
    name: "SUPER_ADMIN",
    scope: "SYSTEM",
    organizationId: null,
  });

  if (superAdminRole) {
    await Role.updateOne(
      { _id: superAdminRole._id },
      { $addToSet: { permissions: { $each: permissionIds } } },
    );
    console.log("MASTER_DATA permissions attached to SUPER_ADMIN.");
  }

  // ORG_ADMIN gets the complete master-data management set for its organization.
  const result = await Role.updateMany(
    {
      name: "ORG_ADMIN",
      scope: "ORGANIZATION",
    },
    { $addToSet: { permissions: { $each: permissionIds } } },
  );

  console.log(
    `MASTER_DATA permissions attached to ${result.modifiedCount} ORG_ADMIN role(s).`,
  );
  console.log("Master Data RBAC permission seed completed.");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Master Data permission seed failed:", error);
    process.exit(1);
  });
